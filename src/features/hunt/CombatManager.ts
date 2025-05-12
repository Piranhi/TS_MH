import { EnemyCharacter } from "../../models/EnemyCharacter";
import { PlayerCharacter } from "../../models/PlayerCharacter";
import { bus } from "../../core/EventBus";
import { Area } from "@/models/Area";

export class CombatManager {
    public isFinished: boolean = false;
    public playerWon: boolean = false;
    private elapsed: number = 0;
    constructor(private readonly playerCharacter: PlayerCharacter, private readonly enemyCharacter: EnemyCharacter, private readonly area: Area) {
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
        if (this.playerWon) {
            this.rewardPlayer();
        }
        bus.emit("reward:renown", 10);
        bus.emit("combat:ended", this.playerWon ? "Player Won" : "Player Died");
    }

    private rewardPlayer() {
        this.area.rollLoot();
    }
}
