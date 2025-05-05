import { EnemyCharacter } from "./Characters/EnemyCharacter";
import { PlayerCharacter } from "./Characters/PlayerCharacter";
import { bus } from "./EventBus";

export class CombatManager {
    public isFinished: boolean = false;
    public playerWon: boolean = false;
    private elapsed: number = 0;
    constructor(private readonly playerCharacter: PlayerCharacter, private readonly enemyCharacter: EnemyCharacter) {
        bus.emit("combat:started", { player: this.playerCharacter, enemy: this.enemyCharacter });
        playerCharacter.beginCombat(enemyCharacter);
        enemyCharacter.beginCombat(playerCharacter);
    }

    public onTick(dt: number) {
        this.elapsed += dt;
        if (this.playerCharacter.isAlive() === false || this.enemyCharacter.isAlive() === false) {
            this.endCombat();
        }
    }

    private endCombat() {
        this.playerCharacter.endCombat();
        this.enemyCharacter.endCombat();
        this.isFinished = true;
        this.playerWon = this.playerCharacter.isAlive();
        bus.emit("reward:renown", 10);
        bus.emit("combat:ended", this.playerWon ? "Player Won" : "Player Died");
    }
}
