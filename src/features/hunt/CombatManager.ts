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
                this.handleCombatUpdate(this.playerCharacter, dt);
                this.handleCombatUpdate(this.enemyCharacter, dt);
                if (this.checkCombatEnd()) return; // Characters may have died from status effects

		// Process abilities for both characters
		this.processCharacterAbilities(this.playerCharacter, this.enemyCharacter, dt);
		if (this.checkCombatEnd()) return;

		this.processCharacterAbilities(this.enemyCharacter, this.playerCharacter, dt);
		if (this.checkCombatEnd()) return;
	}

        private checkCombatEnd(): boolean {
                if (!this.playerCharacter.isAlive() || !this.enemyCharacter.isAlive()) {
                        this.endCombat();
                        return true;
                }
                return false;
        }

        private handleCombatUpdate(character: BaseCharacter, dt: number) {
                // Run any debug updates defined on the character
                (character as any).checkDebugOptions?.();

                const periodicEffects = character.statusEffects.processPeriodicEffects(dt);
                for (const effect of periodicEffects) {
                        if (effect.type === "damage") {
                                const dmg = CombatCalculator.calculatePeriodicDamage(effect.amount, effect.element, character);
                                character.takeDamage(dmg, effect.element);
                        } else if (effect.type === "heal") {
                                character.heal(effect.amount);
                        }
                }

                character.regenStamina(dt);
        }

        private getReadyAbilities(character: BaseCharacter, dt: number): Ability[] {
                if (!character.alive || !character.canAttack) return [];

                const abilities = character
                        .getAbilities()
                        .filter((a) => a.enabled)
                        .sort((a, b) => a.priority - b.priority);

                const speedMultiplier = character.statusEffects.getSpeedModifier();
                const effectiveDt = dt * speedMultiplier;

                abilities.forEach((a) => a.reduceCooldown(effectiveDt));
                return abilities.filter((a) => a.isReady() && character.hasStamina(a.spec.staminaCost));
        }

        private calculateDamage(source: BaseCharacter, target: BaseCharacter, baseMultiplier: number, ability: Ability): number {
                let multiplier = baseMultiplier;
                const mods = source.getAllAbilityModifiersFromAbility(ability.id);
                for (const mod of mods) {
                        if (mod.stat === "multiplier") {
                                multiplier *= 1 + mod.amount / 100;
                        } else if (mod.stat === "addition") {
                                multiplier += mod.amount;
                        }
                }

                return CombatCalculator.calculateDamage(source, target, multiplier, ability.spec.element);
        }

	private processCharacterAbilities(source: BaseCharacter, target: BaseCharacter, dt: number) {
		if (!source.alive || !target.alive) return;

		// Get abilities that are ready to use
                const readyAbilities = this.getReadyAbilities(source, dt);

		for (const ability of readyAbilities) {
			if (!target.alive) break;
			if (!this.checkAbilityConditions(ability, source, target)) continue;

			// Process each effect of the ability
			for (const effectSpec of ability.spec.effects) {
                                if (effectSpec.type === "attack") {
                                        // Calculate damage with ability modifiers
                                        const damage = this.calculateDamage(source, target, effectSpec.value || 1, ability);

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
