import { BaseCharacter } from "@/models/BaseCharacter";
import { ElementType } from "@/shared/types";

export class CombatCalculator {
	/**
	 * Calculate damage for any attack
	 * Single source of truth for all damage calculations
	 */
	static calculateDamage(
		attacker: BaseCharacter,
		defender: BaseCharacter,
		baseDamageMultiplier: number,
		element: ElementType = "physical"
	): { damage: number; isCrit: boolean } {
                // Step 1: Get attacker's base attack and element bonus
                const baseAttack = attacker.stats.get("attack");
                const elementBonusDamage = attacker.stats.get(`${element}Bonus` as any) || 0;

                // Base damage gets the element bonus before any modifiers
                let baseDamage = baseAttack + elementBonusDamage;

                // Step 2: Apply attacker's status modifiers
                const attackModifier = 1 + attacker.statusEffects.getAttackModifier();

                // Step 3: Calculate critical hit
                const critChance = attacker.stats.get("critChance") / 100;
                const isCrit = Math.random() < critChance;
                const critMultiplier = isCrit ? 1 + attacker.stats.get("critDamage") / 100 : 1;

                // Step 4: Add variance
                const variance = 0.9 + Math.random() * 0.2; // 90% to 110%

                // Step 5: Calculate raw damage
                const rawDamage = baseDamage * baseDamageMultiplier * attackModifier * critMultiplier * variance;

                // Step 6: Get defender's defense
                const defense = defender.stats.get("defence");
                const defenseModifier = 1 + defender.statusEffects.getDefenseModifier();
                const effectiveDefense = defense * defenseModifier;

                // Step 7: Apply defense reduction (simple formula)
                const defenseReduction = effectiveDefense / (effectiveDefense + 100);
                const afterDefense = rawDamage * (1 - defenseReduction * 0.5); // Max 50% reduction

                // Step 8: Apply elemental resistance
                const baseResistance = defender.resistances.getBase(element);
                const statusResistance = defender.statusEffects.getResistanceModifier(element);
                const totalResistance = baseResistance + statusResistance;

		// Resistance as percentage: positive reduces damage, negative increases
		const finalDamage = afterDefense * (1 - totalResistance / 100);

		// Always deal at least 1 damage
		return { damage: Math.max(1, Math.floor(finalDamage)), isCrit };
	}

	/**
	 * Calculate healing amount
	 */
	static calculateHealing(source: BaseCharacter, baseHealMultiplier: number): number {
		const baseAttack = source.stats.get("attack");
		const healAmount = baseAttack * baseHealMultiplier;

		// Healing can be boosted by certain stats or effects in the future

		return Math.floor(healAmount);
	}

	/**
	 * Calculate periodic damage (DoT)
	 * Simpler calculation - ignores defense
	 */
	static calculatePeriodicDamage(damage: number, element: ElementType | undefined, defender: BaseCharacter): number {
		// DoTs typically ignore armor but respect resistances
		if (element) {
			const baseResistance = defender.resistances.getBase(element);
			const statusResistance = defender.statusEffects.getResistanceModifier(element);
			const totalResistance = baseResistance + statusResistance;

			damage = damage * (1 - totalResistance / 100);
		}

		return Math.max(1, Math.floor(damage));
	}
}
