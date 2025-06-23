import { StatusEffect } from "./StatusEffect";

export class StatusEffectManager {
	private effects: StatusEffect[] = [];

	add(effect: StatusEffect): void {
		this.effects.push(effect);
	}

        clear(): void {
                this.effects = [];
        }

        getEffects(): readonly StatusEffect[] {
                return this.effects;
        }

	// Handle tick
	// Remove finished effects
	handleTick(dt: number): void {
		for (const effect of this.effects) {
			effect.handleTick(dt);
			if (effect.isFinished) {
				this.effects.splice(this.effects.indexOf(effect), 1);
			}
		}
	}
}
