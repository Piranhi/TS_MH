// ===================================================
// Updated CombatManager.ts
// ===================================================
import { EnemyCharacter } from "../../models/EnemyCharacter";
import { PlayerCharacter } from "../../models/PlayerCharacter";
import { bus } from "../../core/EventBus";
import { Area } from "@/models/Area";
import { Destroyable } from "@/core/Destroyable";
import { GameContext } from "@/core/GameContext";
import { BaseCharacter } from "@/models/BaseCharacter";
import { Ability } from "@/models/Ability";
import { BalanceCalculators } from "@/balance/GameBalance";
import { CombatCalculator } from "./CombatCalculator";

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

	public update(dt: number) {
		// Update both characters (handles status effects, stamina regen, etc.)
		this.playerCharacter.handleCombatUpdate(dt);
		this.enemyCharacter.handleCombatUpdate(dt);

		// Process abilities for both characters
		this.processCharacterAbilities(this.playerCharacter, this.enemyCharacter, dt);
		this.processCharacterAbilities(this.enemyCharacter, this.playerCharacter, dt);

		// Check for combat end
		if (!this.playerCharacter.alive) {
			this.endCombat();
		} else if (!this.enemyCharacter.alive) {
			this.endCombat();
		}
	}

	// src/features/hunt/CombatManager.ts

	private processCharacterAbilities(source: BaseCharacter, target: BaseCharacter, dt: number) {
		if (!source.alive || !target.alive) return;

		// Get abilities that are ready to use
		const readyAbilities = source.getReadyAbilities(dt);

		for (const ability of readyAbilities) {
			if (!target.alive) break;
			if (!this.checkAbilityConditions(ability, source, target)) continue;

			// Process each effect of the ability
			for (const effectSpec of ability.spec.effects) {
				if (effectSpec.type === "attack") {
					// Calculate damage
					const damage = CombatCalculator.calculateDamage(source, target, effectSpec.value || 1, ability.spec.element);

					// Apply damage
					target.takeDamage(damage, ability.spec.element);
				} else if (effectSpec.type === "status") {
					// Apply status effect based on target
					const actualTarget = effectSpec.target === "enemy" ? target : source;
					actualTarget.statusEffects.add(
						effectSpec.effectId!,
						source.stats.get("attack") // For DoT scaling
					);
				} else if (effectSpec.type === "heal") {
					// Apply heal based on target
					const actualTarget = effectSpec.target === "self" ? source : target;
					const healing = CombatCalculator.calculateHealing(source, effectSpec.value || 1);
					actualTarget.heal(healing);
				}
			}

			// Consume resources and reset cooldown
			source.spendStamina(ability.spec.staminaCost);
			ability.resetCooldown();

			// Emit event for UI
			bus.emit("Combat:AbilityUsed", {
				source: source.name,
				ability: ability.spec.displayName,
				target: target.name,
			});
		}
	}

	private checkAbilityConditions(ability: Ability, self: BaseCharacter, target: BaseCharacter): boolean {
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
		const renownReward = BalanceCalculators.getMonsterRenown(this.area.tier, this.enemyCharacter.spec.rarity);
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
