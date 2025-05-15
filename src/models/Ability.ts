import { BaseCharacter } from "./BaseCharacter";
import { SpecRegistryBase } from "./SpecRegistryBase";
import { Effect, effectFactories, EffectSpec } from "./Effects";

export interface AbilitySpec {
	id: string;
	displayName: string;
	effects: EffectSpec[];
	cooldown: number;
	priority: AbilityPriority;
}

export interface AttackState {}
export type AbilityPriority = "Immediate" | "High" | "Low";

export class Ability extends SpecRegistryBase<AbilitySpec> {
	public currentCooldown: number = 0;
	public maxCooldown: number = 0;
	public effects: Effect[];
	private constructor(private readonly spec: AbilitySpec) {
		super();
		this.currentCooldown = spec.cooldown;
		this.maxCooldown = spec.cooldown;
		this.effects = spec.effects.map((spec: EffectSpec) => {
			const factory = effectFactories[spec.type];
			if (!factory) {
				throw new Error(`Unknown effect type ${spec.type}`);
			}
			return factory(spec);
		});
	}

	perform(self: BaseCharacter, target: BaseCharacter) {
		this.effects.forEach((e) => e.apply(self, target));
		this.currentCooldown = this.maxCooldown;
	}

	get id() {
		return this.spec.id;
	}
	get name() {
		return this.spec.displayName;
	}

	get priority() {
		return this.spec.priority;
	}

	init() {
		this.currentCooldown = this.spec.cooldown;
	}

	reduceCooldown(dt: number) {
		this.currentCooldown = Math.max(this.currentCooldown - dt, 0);
	}

	isReady() {
		return this.currentCooldown === 0;
	}

	// Registry.
	// USE THIS FOR CREATING ABILITIES
	public static override specById = new Map<string, AbilitySpec>();
	static create(id: string): Ability {
		const spec = this.specById.get(id);
		if (!spec) throw new Error(`Unknown ability "${id}"`);
		return new Ability(spec);
	}
}
