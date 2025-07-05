import { SpecRegistryBase } from "./SpecRegistryBase";
import { AbilityCondition, AbilityModifier, EffectSpec, ElementType } from "@/shared/types";

export interface AbilitySpec {
	id: string;
	iconUrl: string;
	description: string;
	displayName: string;
	cooldown: number;
	staminaCost: number;
	element: ElementType;
	effects: EffectSpec[];
	conditions: AbilityCondition[];
}

export interface AbilityState {
	id: string;
	abilityModifiers: Map<string, AbilityModifier[]>;
	enabled: boolean;
	priority: number;
}

export interface AbilitySaveState {
	id: string;
	abilityModifiers: Array<[string, AbilityModifier[]]>; // Array of tuples for Map serialization
	enabled: boolean;
	priority: number;
}

export interface AttackState {}

export class Ability extends SpecRegistryBase<AbilitySpec> {
	public currentCooldown: number = 0;
	public maxCooldown: number = 0;
	private constructor(public readonly spec: AbilitySpec, readonly state: AbilityState, readonly startReady: boolean = true) {
		super();
		this.currentCooldown = this.startReady ? 0 : spec.cooldown;
		this.maxCooldown = spec.cooldown;
	}

	get id() {
		return this.spec.id;
	}
	get name() {
		return this.spec.displayName;
	}
	get enabled() {
		return this.state.enabled;
	}

	get description(): string {
		return this.spec.description;
	}
	set enabled(v: boolean) {
		this.state.enabled = v;
	}
	get priority() {
		return this.state.priority;
	}
	set priority(v: number) {
		this.state.priority = v;
	}

	init() {}

	resetCooldown() {
		this.currentCooldown = this.maxCooldown;
	}

	reduceCooldown(dt: number) {
		this.currentCooldown = Math.max(this.currentCooldown - dt, 0);
	}

	isReady() {
		return this.currentCooldown === 0;
	}

	getConditions(): string[] {
		return this.spec.conditions;
	}

	public addAbilityModifier(abilityId: string, modifier: AbilityModifier) {
		const existing = this.state.abilityModifiers.get(abilityId) || [];
		this.state.abilityModifiers.set(abilityId, [...existing, modifier]);
	}

	public getAllAbilityModifiersFromAbility(abilityId: string): AbilityModifier[] {
		return this.state.abilityModifiers.get(abilityId) || [];
	}

	save(): AbilitySaveState {
		return {
			id: this.spec.id,
			abilityModifiers: Array.from(this.state.abilityModifiers.entries()),
			enabled: this.state.enabled,
			priority: this.state.priority,
		};
	}

	static fromJSON(raw: any) {
		const spec = this.specById.get(raw.spec);
		if (!spec) throw new Error(`Unknown ability "${raw.spec}"`);
		return new Ability(spec, raw.state);
	}

	public static override specById = new Map<string, AbilitySpec>();

	static createNew(id: string, startReady: boolean = true): Ability {
		const spec = this.specById.get(id);
		if (!spec) throw new Error(`Unknown ability "${id}"`);
		const state: AbilityState = {
			id: id,
			abilityModifiers: new Map(),
			enabled: true,
			priority: this.specById.size,
		};
		return new Ability(spec, state, startReady);
	}

	static createFromSaveState(saveState: AbilitySaveState): Ability {
		const spec = this.specById.get(saveState.id);
		if (!spec) throw new Error(`Unknown ability "${saveState.id}"`);

		const state: AbilityState = {
			id: saveState.id,
			// Defensive check - ensure we have a valid array
			abilityModifiers: new Map(saveState.abilityModifiers || []),
			enabled: saveState.enabled ?? true,
			priority: saveState.priority ?? 0,
		};

		const ability = new Ability(spec, state);
		return ability;
	}
}
