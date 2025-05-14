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
	private combatEndOverride = false;
	constructor(private readonly playerCharacter: PlayerCharacter, private readonly enemyCharacter: EnemyCharacter, private readonly area: Area) {
		bus.emit("combat:started", { player: this.playerCharacter, enemy: this.enemyCharacter });
		playerCharacter.beginCombat(enemyCharacter);
		enemyCharacter.beginCombat(playerCharacter);
	}

	public onTick(dt: number) {
		if (this.combatEndOverride) return;
		this.elapsed += dt;
		if (this.playerCharacter.isAlive() === false || this.enemyCharacter.isAlive() === false) {
			this.endCombat();
		}
	}

	public endCombatEarly() {
		//Prevent ticking, end combat
		this.combatEndOverride = true;
		this.playerCharacter.endCombat();
		this.enemyCharacter.endCombat();
		bus.emit("combat:ended", "Changing Areas");
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
		bus.emit("combat:ended", this.playerWon ? "Player Won" : "Player fled");
	}

	private rewardPlayer() {
		const lootArray = this.area.rollLoot();
		Player.getInstance().adjustRenown(this.area.getScaledValue(this.enemyCharacter.monster.renownMulti, "renown"));
		lootArray.forEach((loot) => {
			Player.getInstance().inventory.addLootById(loot, 1);
		});
	}
}
