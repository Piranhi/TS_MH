import { printLog } from "@/core/DebugManager";
import { SpecRegistryBase } from "./SpecRegistryBase";
import { AreaScaling, CoreStats, CoreStatsNumbers, scaleEnemyStatsByArea } from "./Stats";
import { BigNumber } from "./utils/BigNumber";

export type MonsterRarity = "common" | "uncommon" | "rare" | "terrifying" | "nightmare";

const renownMultipliers: Record<MonsterRarity, number> = {
	common: 1.0,
	uncommon: 1.2,
	rare: 1.5,
	terrifying: 2.0,
	nightmare: 3.0,
};

export interface MonsterSpecRaw {
	id: string;
	displayName: string;
	rarity: MonsterRarity;
	baseStats: CoreStatsNumbers;
	attacks: string[];
}

export interface MonsterSpec {
	id: string;
	displayName: string;
	rarity: MonsterRarity;
	baseStats: CoreStats; // all BigNumbers!
	attacks: string[];
}

export class Monster extends SpecRegistryBase<MonsterSpec> {
	//private areaScaling: AreaScaling;
	private constructor(private readonly spec: MonsterSpec, private readonly areaScaling: AreaScaling) {
		super();
	}

	get scaledStats(): CoreStats {
		return scaleEnemyStatsByArea(this.spec.baseStats, this.areaScaling);
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

	get renownMulti(): number {
		return renownMultipliers[this.rarity];
	}

	// Registry.
	public static override specById = new Map<string, MonsterSpec>();

	static create(id: string, areaScaling: AreaScaling): Monster {
		const spec = this.specById.get(id);
		if (!spec) throw new Error(`Unknown monster "${id}"`);
		printLog("Spawned new Monster: " + spec.id, 3, "Monster.ts");
		return new Monster(spec, areaScaling);
	}
}
