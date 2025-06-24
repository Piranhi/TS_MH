import { StatusEffect } from "./StatusEffect";

export class StatusEffectManager {
	private effects = new Map<string, StatusEffect>();

	add(effect: StatusEffect): void {
		// Reset duration
		if (this.effects.has(effect.id)) {
			const existingEffect = this.effects.get(effect.id)!;
			if (effect.duration > existingEffect.duration) {
				existingEffect.duration = effect.duration;
			}
			return;
		}
		this.effects.set(effect.id, effect);
	}

	clear(): void {
		this.effects.clear();
	}

	getEffects(): readonly StatusEffect[] {
		return Array.from(this.effects.values());
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
