import { SpecRegistryBase } from "./SpecRegistryBase";

export interface MonsterSpec {
	id: string;
	displayName: string;
	rarity: "common" | "uncommon" | "rare";
	baseStats: { hp: number; attack: number; defence: number; speed: number };
	attacks: string[];
}

export class Monster extends SpecRegistryBase<MonsterSpec> {
	private constructor(private readonly spec: MonsterSpec) {
		super();
	}

	/* --- simple getters --- */
	get id() {
		return this.spec.id;
	}
	get displayName() {
		return this.spec.displayName;
	}
	get rarity() {
		return this.spec.rarity;
	}
	get baseStats() {
		return this.spec.baseStats;
	}

	// Registry.
	public static override specById = new Map<string, MonsterSpec>();

	static create(id: string): Monster {
		const spec = this.specById.get(id);
		if (!spec) throw new Error(`Unknown monster "${id}"`);
		return new Monster(spec);
	}
}
