import { StatusEffect } from "./StatusEffect";

export class StatusEffectManager {
	private effects = new Map<string, StatusEffect>();

	add(effect: StatusEffect): void {
		this.effects.set(effect.id, effect);
	}

	clear(): void {
		this.effects.clear();
	}

	getEffects(): readonly StatusEffect[] {
		return Array.from(this.effects.values());
	}

	hasEffect(effectId: string): boolean {
		return this.effects.has(effectId);
	}

	getTotalEffectValue(effectId: string): number {
		const effect = this.effects.get(effectId);
		if (!effect) {
			return 0;
		}
		return effect.value;
	}

	// Handle tick
	// Remove finished effects
	handleTick(dt: number): void {
		for (const [key, effect] of this.effects) {
			effect.handleTick(dt);
			if (effect.isFinished) {
				this.effects.delete(key); //(this.effects.indexOf(effect), 1);
			}
		}
	}
}
