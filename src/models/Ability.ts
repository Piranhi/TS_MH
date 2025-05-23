import { SpecRegistryBase } from "./SpecRegistryBase";
import { EffectSpec } from "@/shared/types";

export interface AbilitySpec {
	id: string;
	displayName: string;
	cooldown: number;
	effects: EffectSpec[];
}

export interface AttackState {}

export class Ability extends SpecRegistryBase<AbilitySpec> {
	public currentCooldown: number = 0;
	public maxCooldown: number = 0;
	private constructor(public readonly spec: AbilitySpec) {
		super();
		this.currentCooldown = spec.cooldown;
		this.maxCooldown = spec.cooldown;
		console.log(JSON.stringify(this.spec));
	}

	get id() {
		return this.spec.id;
	}
	get name() {
		return this.spec.displayName;
	}

	init() {
		this.currentCooldown = this.spec.cooldown;
	}

	resetCooldown() {
		this.currentCooldown = this.maxCooldown;
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
