import { BaseCharacter } from "./BaseCharacter";

export interface EffectSpec {
	type: EffectType;
	value: number;
}

export interface Effect {
	apply(user: BaseCharacter, target: BaseCharacter): void;
}

export type EffectType = "physical" | "magical" | "heal" | "defence" | "lifesteal";

export class DamageEffect implements Effect {
	constructor(public amount: number) {}
	apply(user: BaseCharacter, target: BaseCharacter) {
		target.takeDamage(this.amount);
	}
}

export class HealEffect implements Effect {
	constructor(public amount: number) {}
	apply(user: BaseCharacter, target: BaseCharacter) {
		user.heal(this.amount);
	}
}

export class BuffEffect implements Effect {
	constructor(public stat: keyof CharacterData, public amount: number, public duration: number) {}
	apply(user: BaseCharacter, target: BaseCharacter) {
		//user.addBuff(this.stat, this.amount, this.duration);
	}
}

export const effectFactories: Record<string, (spec: EffectSpec) => Effect> = {
	damage: (spec) => new DamageEffect(spec.value),
	heal: (spec) => new HealEffect(spec.value),
	//buff: (stat, amt, dur) => new BuffEffect(stat, amt, dur),
};
