 import { PlayerCharacter } from "./Characters/PlayerCharacter";
import { Bounded } from "./domain/value-objects/Bounded";
import { bus } from "./EventBus";
import { TrainedStat, TrainedStatData } from "./TrainedStat";

interface PlayerData{
    level: number;
    renown: Bounded;
    experience: number;
    character: PlayerCharacter;
    stamina: Bounded;
    trainedStats: Record<string, TrainedStat>;
}

 export class Player{

    public character: PlayerCharacter;

    private readonly name = "Player";
    private level: number;
    private renown: Bounded;

    private experience: number;
    private stamina: Bounded;

    public trainedStats: Map<string, TrainedStat> = new Map();
    
    private staminaMultiplier: number = 1;
    private renownMultiplier: number = 1;

    constructor(data: PlayerData){
        this.level = data.level;
        this.renown = data.renown;
        this.experience = data.experience;
        this.character = data.character;
        this.stamina = data.stamina;
        this.trainedStats = new Map(Object.entries(data.trainedStats));
        this.character = PlayerCharacter.createNewPlayer()
    }



    static createNew(): Player{  
        const defaults: PlayerData = {
            level: 1,
            renown: new Bounded(0, 1000, 0),
            experience: 0,
            character: PlayerCharacter.createNewPlayer(),
            stamina: new Bounded (0,10,0),
            trainedStats: {
                attack:  new TrainedStat({
                            id:             "attack",
                            name:           "Attack",
                            level:          1,
                            progress:       0,
                            nextThreshold:  50,
                            assignedPoints: 0,
                            baseGainRate:   1,
                            status: "Unlocked"

                          }),
                agility: new TrainedStat({
                            id:             "agility",
                            name:           "Agility",
                            level:          1,
                            progress:       0,
                            nextThreshold:  100,
                            assignedPoints: 0,
                            baseGainRate:   0.5,
                            status: "Locked"
                          }),
              },
        }
        return new Player(defaults);
    }

    static loadFromSave(data: PlayerData): Player{
        return new Player(data);
    }

    async init(): Promise<void> {
        bus.emit('player:initialized', this);
        bus.on('Game:GameTick', (dt) => this.handleGameTick(dt));
        bus.on('Game:UITick', (dt) => this.handleUITick(dt));
        bus.on("reward:renown", (amt) => this.adjustRenown(amt))
    }

    handleGameTick(dt: number): void {

    }

    handleUITick(dt: number): void{
        this.increaseStamina(dt)
        this.updateStats(dt)
    }

    private updateStats(dt: number){
        this.trainedStats.forEach(stat => stat.update(dt))
    }

    public allocateTrainedStat(id: string, delta: number){
        const stat = this.trainedStats.get(id)
        if(!stat)return;

        if( delta > 0 && this.stamina.current >= delta){
            stat.assignedPoints += delta;
            this.stamina.current -= delta;
            bus.emit("player:trainedStat-changed", stat.id)
        } else if(delta < 0 && stat.assignedPoints >= delta){
            stat.assignedPoints += delta;
            this.stamina.current -= delta;
            bus.emit("player:trainedStat-changed", stat.id)
        }

    }


    public getPlayerCharacter() : PlayerCharacter{
        return this.character;
    }

    private increaseStamina(delta:number):void{
        this.stamina.adjust(delta);
        bus.emit('player:stamina-changed', this.stamina);
    }

    public levelUp(): void {
        this.level += 1;
        bus.emit('player:level-up', this.level);
    }

    public adjustRenown(delta: number): void{
        this.renown.adjust(delta);
        bus.emit('Renown:Changed', this.renown);
    }

}

export const player = Player.createNew();
