import { printLog } from "@/core/DebugManager";
import { BaseCharacter } from "./BaseCharacter";
import { SpecRegistryBase } from "./SpecRegistryBase";

export interface AttackSpec {
	id: string;
	displayName: string;
	type: AttackTypes;
	power: number;
	cooldown: number;
	priority: AttackPriority;
}

export interface AttackState {}

export type AttackTypes = "physical" | "magical";

export type AttackPriority = "Immediate" | "High" | "Low";

export class Attack extends SpecRegistryBase<AttackSpec> {
	public currentCooldown: number = 0;
	private constructor(private readonly spec: AttackSpec) {
		super();
		this.currentCooldown = spec.cooldown;
	}

	perform(self: BaseCharacter, target: BaseCharacter) {
		const totalDamage = Math.max(this.spec.power * self.attack - target.defence, 0);
		target.takeDamage(totalDamage);
		printLog(self.name + " attacks " + target.name + " for " + totalDamage.toString(), 3, "Attack.ts");

		this.currentCooldown = this.spec.cooldown;
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
		this.currentCooldown -= Math.max(this.currentCooldown - dt, 0);
	}

	isReady() {
		return this.currentCooldown <= 0;
	}

	// Registry.
	public static override specById = new Map<string, AttackSpec>();
	static create(id: string): Attack {
		const spec = this.specById.get(id);
		if (!spec) throw new Error(`Unknown attack "${id}"`);
		return new Attack(spec);
	}
}
