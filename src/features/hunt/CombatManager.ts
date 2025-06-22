// ===================================================
// Updated CombatManager.ts
// ===================================================
import { EnemyCharacter } from "../../models/EnemyCharacter";
import { PlayerCharacter } from "../../models/PlayerCharacter";
import { bus } from "../../core/EventBus";
import { Area } from "@/models/Area";
import { EffectProcessor } from "./EffectProcessor";
import { Destroyable } from "@/core/Destroyable";
import { GameContext } from "@/core/GameContext";

export class CombatManager extends Destroyable {
	private effectProcessor: EffectProcessor;
	private context: GameContext;
	public isFinished: boolean = false;
	public playerWon: boolean = false;
	private elapsed: number = 0;
	private combatEndOverride = false;

	constructor(private readonly playerCharacter: PlayerCharacter, private readonly enemyCharacter: EnemyCharacter, private readonly area: Area) {
		super();
		this.context = GameContext.getInstance();
		this.effectProcessor = new EffectProcessor();

		playerCharacter.beginCombat();
		enemyCharacter.beginCombat();

		bus.emit("combat:started", {
			player: this.playerCharacter,
			enemy: this.enemyCharacter,
		});
	}

	public onTick(dt: number) {
		if (this.combatEndOverride) return;
		this.elapsed += dt;

		// Check for combat end again
		// Wait for the next tick so that character displays update
		if (!this.playerCharacter.isAlive() || !this.enemyCharacter.isAlive()) {
			this.endCombat();
			return; //
		}

		// Process player effects
		const playerEffects = this.playerCharacter.getReadyEffects(dt);
		for (const effect of playerEffects) {
			this.effectProcessor.apply(effect, this.enemyCharacter);
		}

		// Check for combat end
		if (!this.playerCharacter.isAlive() || !this.enemyCharacter.isAlive()) {
			return;
		}

		// Process enemy effects
		const enemyEffects = this.enemyCharacter.getReadyEffects(dt);
		for (const effect of enemyEffects) {
			this.effectProcessor.apply(effect, this.playerCharacter);
		}
	}

	public endCombatEarly() {
		this.combatEndOverride = true;
		this.playerCharacter.endCombat();
		this.enemyCharacter.endCombat();
		bus.emit("combat:ended", "Changing Areas");
		this.enemyCharacter.destroy();
	}

	private endCombat() {
		this.playerCharacter.endCombat();
		this.enemyCharacter.endCombat();
		this.isFinished = true;
		this.playerWon = this.playerCharacter.isAlive();

		if (this.playerWon) {
			// Emit kill event
			bus.emit("hunt:areaKill", {
				enemyId: this.enemyCharacter.spec.id,
				areaId: this.area.id,
			});

			this.rewardPlayer();
		}

		bus.emit("combat:ended", this.playerWon ? "Player Won" : "Player fled");
		this.enemyCharacter.destroy();
	}

	private rewardPlayer() {
		// Award renown
		const renownReward = 1; // TODO - Update from Game Balance - Use renown scaling.
		this.context.player.adjustRenown(renownReward);

		// Award experience
		this.context.character.gainXp(this.area.getXpPerKill(false));

		//this.context.player.gainExperience(expReward);

		// Roll and award loot
		const lootArray = this.area.rollLoot();
		if (lootArray && lootArray.length > 0) {
			lootArray.forEach((lootId) => {
				this.context.inventory.addLootById(lootId, 1);
			});
			bus.emit("inventory:dropped", lootArray);
		}
	}
}
