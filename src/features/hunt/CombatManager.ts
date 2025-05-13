import { EnemyCharacter } from "../../models/EnemyCharacter";
import { PlayerCharacter } from "../../models/PlayerCharacter";
import { bus } from "../../core/EventBus";
import { Area } from "@/models/Area";
import { Player } from "@/models/player";
import { BigNumber } from "@/models/utils/BigNumber";

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
            bus.emit("lifetimeStat:add", { stat: "monstersKilled", amt: 1 });
            this.rewardPlayer();
        }
        bus.emit("combat:ended", this.playerWon ? "Player Won" : "Player Died");
    }

    private rewardPlayer() {
        const loot = this.area.rollLoot();
        console.log(this.area.getScaledValue(this.enemyCharacter.spec.renownMulti, "renown"));
        Player.getInstance().adjustRenown(this.area.getScaledValue(this.enemyCharacter.spec.renownMulti, "renown"));
        loot.forEach((l) => {
            Player.getInstance().inventory.addLootById(l.itemId, l.qty);
        });
    }
}
