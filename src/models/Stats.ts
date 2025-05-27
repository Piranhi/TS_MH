export const MAX_BARS_PER_SECOND = 10;

// ENEMY SCALING - PER TIER
export const MONSTER_HP_GROWTH = 1.75; // HP   ×1.75 per area
export const MONSTER_ATTACK_GROWTH = 1.45; // ATK  ×1.45 per area
export const MONSTER_DEFENCE_GROWTH = 1.4; // DEF  ×1.40 per area

// EQUIPMENT SCALING

// PLAYER SCALING

export const STAT_KEYS: (keyof Stats)[] = [
	"attack",
	"defence",
	"speed",
	"hp",
	"power",
	"guard",
	"critChance",
	"critDamage",
	"evasion",
	"lifesteal",
	"encounterChance",
];

export interface CoreStats {
	attack: number;
	defence: number;
	speed: number;
	hp: number;
}

/** Build Stats */
export interface BuildStats {
	power: number;
	guard: number;
	critChance: number;
	critDamage: number;
	evasion: number;
	lifesteal: number;
	encounterChance: number;
}

export interface TrainedStatState {
	id: TrainedStatType;
	level: number;
	progress: number;
	//nextThreshold: number;
	assignedPoints: number;
	status: TrainedStatStatus;
}

export interface TrainedStatSpec {
	id: TrainedStatType;
	name: string;
	baseGainRate: number;
	baseMultiplier: number;
	maxAssigned: number;
	statMod: StatsModifier;
}

export interface StatsProvider {
	get(stat: StatKey): number;
}

export const defaultPlayerStats: Stats = {
	attack: 10,
	defence: 10,
	speed: 2,
	hp: 100,
	power: 0,
	guard: 0,
	critChance: 0,
	critDamage: 0,
	evasion: 0,
	lifesteal: 0,
	encounterChance: 1,
};

export interface AreaScaling {
	hp: number;
	attack: number;
	defence: number;
	speed: number;
	dropChance: number;
	renown: number;
}

export type Stats = CoreStats & BuildStats;
export type StatKey = keyof Stats;
export type StatsModifier = Partial<Stats>;
export type TrainedStatType = "power" | "guard" | "power2" | "guard2" | "crit";
export type TrainedStatStatus = "Unlocked" | "Locked" | "Hidden";
