import { printLog } from "@/core/DebugManager";
import { SpecRegistryBase } from "./SpecRegistryBase";
import { CoreStats, Stats } from "./Stats";
import { BalanceCalculators } from "@/balance/GameBalance";
import { ENEMY_ARCHETYPES, EnemyArchetype } from "@/shared/types";

export type MonsterRarity = "common" | "uncommon" | "rare" | "terrifying" | "nightmare";

export interface MonsterSpec {
	id: string;
	displayName: string;
	rarity: MonsterRarity;
	archetype: EnemyArchetype; // Changed from baseStats
	abilities: string[];
	imgUrl: string;
}

// In Monster.ts
export class Monster extends SpecRegistryBase<MonsterSpec> {
	private constructor(
		private readonly spec: MonsterSpec,
		private readonly areaTier: number = 1 // Add area tier
	) {
		super();
	}

	get areaScaledStats(): Stats {
		const base = this.baseStats;
		return {
			attack: this.scaleForArea(base.attack, "attack"),
			defence: this.scaleForArea(base.defence, "defense"),
			speed: base.speed, // Don't scale speed, or scale differently
			hp: this.scaleForArea(base.hp, "hp"),
			power: 0,
			guard: 0,
			critChance: 0,
			critDamage: 0,
			evasion: 0,
			lifesteal: 0,
			encounterChance: 0,
		};
	}

	private scaleForArea(baseStat: number, statType: "hp" | "attack" | "defense"): number {
		// Use your existing BalanceCalculators or growth formula
		return BalanceCalculators.getMonsterStat(baseStat, this.areaTier, statType);
		// OR use the old growth formula:
		// const growthFactors = { hp: 1.75, attack: 1.45, defense: 1.4 };
		// return baseStat * 10 * Math.pow(growthFactors[statType], this.areaTier - 1);
	}

	/* --- simple getters --- */

	get archetype(): EnemyArchetype {
		return this.spec.archetype;
	}

	// Add this getter to access the full archetype object
	get archetypeData() {
		return ENEMY_ARCHETYPES[this.spec.archetype];
	}

	get id() {
		return this.spec.id;
	}
	get displayName() {
		return this.spec.displayName;
	}
	get rarity() {
		return this.spec.rarity;
	}

	get baseStats(): CoreStats {
		return ENEMY_ARCHETYPES[this.spec.archetype];
	}

	get renownMulti(): number {
		return BalanceCalculators.getMonsterRenown(1, this.rarity);
	}
	get abilities(): string[] {
		// Fallback to spec abilities or just basic_melee
		return this.spec.abilities?.length ? this.spec.abilities : ["basic_melee"];
	}

	get imgUrl(): string {
		return this.spec.imgUrl;
	}

	// Registry.
	public static override specById = new Map<string, MonsterSpec>();

	// Update create method
	static create(spec: MonsterSpec, areaTier: number = 1): Monster {
		printLog("Spawned new Monster: " + spec.id, 3, "Monster.ts");
		return new Monster(spec, areaTier);
	}
}
