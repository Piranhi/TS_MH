// EQUIPMENT SCALING

// PLAYER SCALING

export const STAT_KEYS: (keyof Stats)[] = [
	"attack",
	"defence",
	"speed",
	"hp",
	"critChance",
	"critDamage",
	"evasion",
	"lifesteal",
	"encounterChance",
	"fireBonus",
	"iceBonus",
	"poisonBonus",
	"lightningBonus",
	"lightBonus",
	"physicalBonus",
];

export type AbilityModifierStats = "addition" | "multiplier" | "duration" | "cooldown" | "cost" | "critChance" | "critDamage";

export interface CoreStats {
	attack: number;
	defence: number;
	speed: number;
	hp: number;
}

export interface EnemyArchetypeData extends CoreStats {
	defaultAbilities: string[];
}

/** Build Stats */
export interface BuildStats {
	critChance: number;
	critDamage: number;
	evasion: number;
	lifesteal: number;
	encounterChance: number;
	fireBonus: number;
	iceBonus: number;
	poisonBonus: number;
	lightningBonus: number;
	lightBonus: number;
	physicalBonus: number;
}

export interface TrainedStatState {
	id: TrainedStatType;
	level: number;
	progress: number;
	nextThreshold: number;
	assignedPoints: number;
	status: TrainedStatStatus;
}

export interface TrainedStatSpec {
	id: TrainedStatType;
	name: string;
	baseMultiplier: number;
	levelUpBase: number;
	statMod: StatsModifier;
}

export interface StatsProvider {
	get(stat: StatKey): number;
}

export const defaultPlayerStats: Stats = {
	attack: 10,
	defence: 10,
	speed: 1,
	hp: 100,
	critChance: 1,
	critDamage: 0,
	evasion: 0,
	lifesteal: 0,
	encounterChance: 1,
	fireBonus: 0,
	iceBonus: 0,
	poisonBonus: 0,
	lightningBonus: 0,
	lightBonus: 0,
	physicalBonus: 0,
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
export type TrainedStatType = "attack1" | "attack2" | "defence1" | "defence2";
export type TrainedStatStatus = "Unlocked" | "Locked" | "Hidden";
