// EQUIPMENT SCALING

import { PrestigeState } from "@/shared/stats-types";

// PLAYER SCALING

export const STAT_KEYS: (keyof Stats)[] = [
	"attack",
	"defence",
	"speed",
	"hp",
	"regen",
	"critChance",
	"critDamage",
	"evasion",
	"lifesteal",
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

/** Build Stats - Combat related stats that can be modified by equipment/abilities */
export interface BuildStats {
	regen: number;
	critChance: number;
	critDamage: number;
	evasion: number;
	lifesteal: number;
	physicalBonus: number;
	fireBonus: number;
	iceBonus: number;
	poisonBonus: number;
	lightningBonus: number;
	lightBonus: number;
}

/** Bloodline Stats - Permanent player progression stats */
export interface BloodlineStats {
	encounterChance: number;
	vigour: number;
	luck: number;
	classPoints: number;
}

// Friendly names for stats
export const STAT_DISPLAY_NAMES: Record<string, string> = {
	// Core Stats
	attack: "Attack",
	defence: "Defence",
	speed: "Speed",
	hp: "Health",

	// Build Stats
	regen: "Regen",
	critChance: "Crit Chance",
	critDamage: "Crit Damage",
	evasion: "Evasion",
	lifesteal: "Lifesteal",
	physicalBonus: "Physical Bonus",
	fireBonus: "Fire Bonus",
	iceBonus: "Ice Bonus",
	poisonBonus: "Poison Bonus",
	lightningBonus: "Lightning Bonus",
	lightBonus: "Light Bonus",

	// Bloodline Stats
	encounterChance: "Encounter Chance",
	vigour: "Vigour",
	luck: "Luck",
	classPoints: "Class Points",
};

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

export const defaultPlayerCharStats: Stats = {
	attack: 10,
	defence: 10,
	speed: 1,
	hp: 100,
	regen: 0,
	critChance: 0,
	critDamage: 0,
	evasion: 0,
	lifesteal: 0,
	fireBonus: 0,
	iceBonus: 0,
	poisonBonus: 0,
	lightningBonus: 0,
	lightBonus: 0,
	physicalBonus: 0,
};

export const defaultBloodlineStats: BloodlineStats = {
	encounterChance: 1,
	vigour: 1,
	luck: 0,
	classPoints: 0,
};

export const defaultPrestigeState: PrestigeState = {
	runsCompleted: 0,
	totalMetaPoints: 0,
	permanentAttack: 0,
	permanentDefence: 0,
	permanentHP: 0,
};

export const defaultPlayerStats = {
	level: 1,
	renown: 0,
	gold: 0,
	energyCurrent: 1,
	energyMax: 1,
	experience: 0,
	bloodlineStats: defaultBloodlineStats,
	prestigeState: defaultPrestigeState,
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
export type BloodlineStatKey = keyof BloodlineStats;
export type TrainedStatType = "attack1" | "attack2" | "defence1" | "defence2";
export type TrainedStatStatus = "Unlocked" | "Locked" | "Hidden";
