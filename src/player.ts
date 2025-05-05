 import { PlayerCharacter } from "./Characters/PlayerCharacter";
import { Bounded } from "./domain/value-objects/Bounded";
import { bus } from "./EventBus";

interface PlayerData{
    level: number;
    renown: Bounded;
    experience: number;
    character: PlayerCharacter;
    stamina: Bounded;
}

 export class Player{


    private readonly name = "Player";
    private level: number;
    private renown: Bounded;
    private experience: number;
    private character: PlayerCharacter;
    private stamina: Bounded;
    
    private staminaMultiplier: number = 1;
    private renownMultiplier: number = 1;

    constructor(data: PlayerData){
        this.level = data.level;
        this.renown = data.renown;
        this.experience = data.experience;
        this.character = data.character;
        this.stamina = data.stamina;
    }



    static createNew(): Player{
        const defaults: PlayerData = {
            level: 1,
            renown: new Bounded(0, 1000, 0),
            experience: 0,
            character: PlayerCharacter.createNewPlayer(),
            stamina: new Bounded (0,10,0)
        }
        return new Player(defaults);
    }

    static loadFromSave(data: PlayerData): Player{
        return new Player(data);
    }

    async init(): Promise<void> {
        bus.emit('player:initialized', this);
        bus.on('Game:GameTick', (dt) => this.handleTick(dt));
        bus.on("reward:renown", (amt) => this.adjustRenown(amt))
    }

    handleTick(dt: number): void {
        this.increaseStamina(dt)
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

