import { ElementType } from "@/shared/types";
import { StatusDefinition, STATUSES } from "./satus-definition";

interface ActiveEffect {
	definition: StatusDefinition;
	remaining: number;
	sourceAttack?: number; // Store source's attack for DoT scaling
}

export class StatusEffectManager {
	private effects = new Map<string, ActiveEffect>();

	/**
	 * Add or refresh a status effect
	 */
	add(statusId: string, sourceAttack?: number): void {
		const definition = STATUSES[statusId];
		if (!definition) {
			console.warn(`Unknown status: ${statusId}`);
			return;
		}

		// Simple rule: adding same effect refreshes duration
		this.effects.set(statusId, {
			definition,
			remaining: definition.duration,
			sourceAttack,
		});
	}

	public hasEffect(effectId: string): boolean {
		return this.effects.has(effectId);
	}

	// Add this helper method
	public getEffect(effectId: string): ActiveEffect | undefined {
		return this.effects.get(effectId);
	}

	/**
	 * Get total attack modifier from all status effects
	 */
	getAttackModifier(): number {
		let total = 0;
		for (const effect of this.effects.values()) {
			if (effect.definition.modifiers?.attackPercent) {
				total += effect.definition.modifiers.attackPercent;
			}
		}
		return total;
	}

	/**
	 * Get total defense modifier from all status effects
	 */
	getDefenseModifier(): number {
		let total = 0;
		for (const effect of this.effects.values()) {
			if (effect.definition.modifiers?.defensePercent) {
				total += effect.definition.modifiers.defensePercent;
			}
		}
		return total;
	}

	/**
	 * Get total speed modifier (takes the lowest)
	 */
	getSpeedModifier(): number {
		let lowest = 1.0;
		for (const effect of this.effects.values()) {
			if (effect.definition.modifiers?.speedPercent !== undefined) {
				const modifier = 1 + effect.definition.modifiers.speedPercent;
				lowest = Math.min(lowest, modifier);
			}
		}
		return lowest;
	}

	/**
	 * Get resistance modifier for an element
	 */
	getResistanceModifier(element: ElementType): number {
		let total = 0;
		for (const effect of this.effects.values()) {
			const resistances = effect.definition.modifiers?.resistances;
			if (resistances && resistances[element]) {
				total += resistances[element];
			}
		}
		return total;
	}

	/**
	 * Process periodic effects (DoT/HoT)
	 * Returns array of damage/heal events to apply
	 */
	processPeriodicEffects(dt: number): Array<{ type: "damage" | "heal"; amount: number; element?: ElementType }> {
		const results: Array<{ type: "damage" | "heal"; amount: number; element?: ElementType }> = [];

		for (const [id, effect] of this.effects) {
			// Update duration
			effect.remaining -= dt;
			if (effect.remaining <= 0) {
				this.effects.delete(id);
				continue;
			}

			// Process periodic effects
			if (effect.definition.periodic) {
				const periodic = effect.definition.periodic;

				if (periodic.damagePerSecond) {
					let damage = periodic.damagePerSecond * dt;

					// Add attack scaling if applicable
					if (periodic.scaleWithAttack && effect.sourceAttack) {
						damage += effect.sourceAttack * periodic.scaleWithAttack * dt;
					}

					results.push({
						type: "damage",
						amount: damage,
						element: periodic.element,
					});
				}

				if (periodic.healPerSecond) {
					let heal = periodic.healPerSecond * dt;

					// Add attack scaling if applicable
					if (periodic.scaleWithAttack && effect.sourceAttack) {
						heal += effect.sourceAttack * periodic.scaleWithAttack * dt;
					}

					results.push({
						type: "heal",
						amount: heal,
					});
				}
			}
		}

		return results;
	}

	/**
	 * Clear all effects
	 */
	clear(): void {
		this.effects.clear();
	}

	/**
	 * Get active effects for UI display
	 */
	getActiveEffects(): Array<{ id: string; name: string; remaining: number }> {
		return Array.from(this.effects.entries()).map(([id, effect]) => ({
			id,
			name: effect.definition.name,
			remaining: effect.remaining,
		}));
	}
}
