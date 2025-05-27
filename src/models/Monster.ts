import { printLog } from "@/core/DebugManager";
import { SpecRegistryBase } from "./SpecRegistryBase";
import { CoreStats, Stats } from "./Stats";
import { BalanceCalculators } from "@/balance/GameBalance";

export type MonsterRarity = "common" | "uncommon" | "rare" | "terrifying" | "nightmare";

const renownMultipliers: Record<MonsterRarity, number> = {
	common: 1.0,
	uncommon: 1.2,
	rare: 1.5,
	terrifying: 2.0,
	nightmare: 3.0,
};

export interface MonsterSpec {
	id: string;
	displayName: string;
	rarity: MonsterRarity;
	baseStats: CoreStats;
	abilities: string[];
	imgUrl: string;
}

export class Monster extends SpecRegistryBase<MonsterSpec> {
	private constructor(private readonly spec: MonsterSpec) {
		super();
	}

	get areaScaledStats(): Stats {
		return {
			attack: this.spec.baseStats.attack,
			defence: this.spec.baseStats.defence,
			speed: this.spec.baseStats.speed,
			hp: this.spec.baseStats.hp,
			power: 0,
			guard: 0,
			critChance: 0,
			critDamage: 0,
			evasion: 0,
			lifesteal: 0,
			encounterChance: 0,
		};
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
		// Use centralized calculator
		return BalanceCalculators.getMonsterRenown(1, this.rarity);
	}

	get abilities(): string[] {
		return this.spec.abilities;
	}

	get imgUrl(): string {
		return this.spec.imgUrl;
	}

	// Registry.
	public static override specById = new Map<string, MonsterSpec>();

	// Created in Area.ts - With scaling applied
	static create(spec: MonsterSpec) {
		printLog("Spawned new Monster: " + spec.id, 3, "Monster.ts");
		return new Monster(spec);
	}
}
