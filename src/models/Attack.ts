import { BaseCharacter } from "@/features/Characters/BaseCharacter";

export interface AttackSpec {
	id: string;
	displayName: string;
	type: "physical" | "magical";
	power: number;
	cooldown: number;
}

type attackState = {
	spec: AttackSpec;
	currentCooldown: number;
};

export class Attack {
	public currentCooldown: number = 0;

	// Registry.
	private static specById = new Map<string, AttackSpec>();
	static registerSpecs(specs: AttackSpec[]) {
		specs.forEach((s) => this.specById.set(s.id, s));
	}
	static create(id: string): Attack {
		const spec = this.specById.get(id);
		if (!spec) throw new Error(`Unknown attack "${id}"`);
		return new Attack(spec);
	}

	private constructor(private readonly spec: AttackSpec) {
		this.currentCooldown = spec.cooldown;
	}

	perform(self: BaseCharacter, target: BaseCharacter) {
		target.takeDamage(Math.max(this.spec.power * self.stats.strength - target.stats.defence, 0));
		this.currentCooldown = this.spec.cooldown;
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

	reduceCooldown(dt: number) {
		this.currentCooldown -= dt;
	}

	isReady() {
		return this.currentCooldown <= 0;
	}
}
