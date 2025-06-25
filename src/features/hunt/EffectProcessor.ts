import { printLog } from "@/core/DebugManager";
import { BaseCharacter } from "@/models/BaseCharacter";
import { AbilityModifier, EffectInstance, EffectResult } from "@/shared/types";
import { StatusEffect } from "./StatusEffect";

export class EffectProcessor {
	private readonly defenceConstant = 100;
	constructor(private readonly self: BaseCharacter, private readonly target: BaseCharacter) {}

	public apply(effect: EffectInstance): EffectResult {
		let outcomeValue = 0;
		const abilityModifiers = effect.source.getAllAbilityModifiersFromAbility(effect.abilityId);

		switch (effect.type) {
			case "attack":
				outcomeValue = this.applyDamage(effect.rawValue, abilityModifiers, this.target);
				break;
			case "heal":
				outcomeValue = this.applyHeal(effect.rawValue, abilityModifiers, this.target);
				break;
			case "status":
				this.applyStatus(effect, abilityModifiers);
				break;
			default:
				throw new Error(`Unknown effect type ${effect.type}`);
		}

		return {
			source: effect.source,
			target: this.target,
			effect,
			outcomeValue,
		};
	}

	private applyDamage(rawDamage: number, abilityModifiers: AbilityModifier[], target: BaseCharacter): number {
		if (!target.canTakeDamage) return 0;

		let abilityModDamage = 0;
		abilityModifiers.forEach((mod) => {
			if (mod.stat === "addition") {
				abilityModDamage += mod.amount;
			}
		});
		const totalAttack = rawDamage + abilityModDamage;
		const totalDefence = target.stats.get("defence") * (1 + target.stats.get("guard") / 100);

		const mitigationFactor = 1 - totalDefence / (totalDefence + this.defenceConstant);

		const finalDamage = Math.floor(Math.max(0, rawDamage * mitigationFactor));
		target.hp.decrease(finalDamage);
		printLog(
			`${target.name} taking damage. Inc: [RAW]${rawDamage} - [DEF]${totalDefence}, [MIT]${
				mitigationFactor - 1
			}  - [NET]${finalDamage}`,
			3,
			"EffectProcessor.ts",
			"combat"
		);
		// Debug invincible
		if (!target.canDie) {
			target.setToMaxHP();
		}

		return finalDamage;
	}

	private applyHeal(rawHealPercent: number, abilityModifiers: AbilityModifier[], target: BaseCharacter): number {
		const healAmount = target.maxHp * (rawHealPercent / 100);
		if (healAmount <= 0) return 0;
		target.hp.increase(healAmount);
		printLog(`${target.name} healing. Inc: [RAW]${rawHealPercent}- [NET]${healAmount}}`, 3, "EffectProcessor.ts", "combat");
		return healAmount;
	}

	private applyStatus(effect: EffectInstance, abilityModifiers: AbilityModifier[]): number {
		const statusEffect = new StatusEffect(effect.effectId!, effect.durationSeconds!, effect.rawValue, effect.statKey!, "debuff");

		// Apply status effect to target or self
		effect.target === "enemy" ? this.target.addStatusEffect(statusEffect) : this.self.addStatusEffect(statusEffect);
		return 0;
	}
}
