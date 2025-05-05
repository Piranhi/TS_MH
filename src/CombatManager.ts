import { EnemyCharacter } from "./Characters/EnemyCharacter";
import { PlayerCharacter } from "./Characters/PlayerCharacter";
import { bus } from "./EventBus";



export class CombatManager {
    public isFinished: boolean = false;
    public playerWon: boolean = false;
    private elapsed: number = 0;
    constructor(
        private readonly playerCharacter: PlayerCharacter,
        private readonly enemyCharacter: EnemyCharacter,
    ){
        bus.emit("combat:started", {player: this.playerCharacter, enemy: this.enemyCharacter})
    }

    public onTick(dt: number) {
        this.elapsed += dt;
        if(this.elapsed > 1){
            this.endCombat();
        }

    }

    private endCombat(){
        this.isFinished = true;
        this.playerWon = Math.random() < 0.7;
        bus.emit("reward:renown", 10)
        bus.emit("combat:ended", this.playerWon? "Player Won" : "Player Died")
    }

}