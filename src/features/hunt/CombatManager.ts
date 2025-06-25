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
import { BaseCharacter } from "@/models/BaseCharacter";
import { Ability } from "@/models/Ability";
import { EffectInstance } from "@/shared/types";

export class CombatManager extends Destroyable {
	private context: GameContext;
	public isFinished: boolean = false;
	public playerWon: boolean = false;
	private elapsed: number = 0;
	private combatEndOverride = false;

	constructor(private readonly playerCharacter: PlayerCharacter, private readonly enemyCharacter: EnemyCharacter, private readonly area: Area) {
		super();
		this.context = GameContext.getInstance();

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

		// Handle status effects, stamina, etc
		this.playerCharacter.handleCombatUpdate(dt);
		this.enemyCharacter.handleCombatUpdate(dt);

		// Check for combat end again
		// Wait for the next tick so that character displays update
		if (!this.playerCharacter.isAlive() || !this.enemyCharacter.isAlive()) {
			this.endCombat();
			return; //
		}

		// Process player effects
		this.processCharacterAbilities(this.playerCharacter, this.enemyCharacter, dt);

		// Check for combat end
		if (!this.playerCharacter.isAlive() || !this.enemyCharacter.isAlive()) {
			return;
		}

		// Process enemy effects
		this.processCharacterAbilities(this.enemyCharacter, this.playerCharacter, dt);
	}

	private processCharacterAbilities(self: BaseCharacter, target: BaseCharacter, dt: number) {
		// Process character to find abilities that are ready to be used.
		const readyAbilities = self.getReadyAbilities(dt);
		const validAbilities = readyAbilities.filter((ability) => this.checkAbilityConditions(ability, self, target));
		if (validAbilities.length === 0) return;

		// Create Effect processor
		// Cycle through abilities and create effect instances.
		const effectProcessor = new EffectProcessor(self, target);
		for (const ability of validAbilities) {
			// create effects from ability
			const effects = self.createEffectInstance(ability);
			effects.forEach((effect) => effectProcessor.apply(effect));
		}
	}

	checkAbilityConditions(ability: Ability, self: BaseCharacter, target: BaseCharacter): boolean {
		if (!ability.spec.conditions) return true;
		if (ability.spec.conditions.length === 0) return true;

		for (const condition of ability.spec.conditions) {
			switch (condition) {
				case "selfNotFullHealth":
					if (self.currentHp >= self.maxHp) return false;
					break;
				default:
					break;
			}
		}

		return true;
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
