import { TrainedStat } from "./TrainedStat";

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

export interface TrainedStatData {
	id: TrainedStatType;
	name: string;
	level: number;
	progress: number;
	nextThreshold: number;
	assignedPoints: number;
	baseGainRate: number;
	status: TrainedStatStatus;
	statMod: Partial<StatsModifier>;
}

export interface StatsProvider {
	get(stat: StatKey): number;
}

export const defaultPlayerStats: Stats = {
	attack: 1,
	defence: 10,
	speed: 1,
	hp: 1000,
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
export type TrainedStatType = "attack" | "agility" | "crit";
export type TrainedStatStatus = "Unlocked" | "Locked" | "Hidden";

export function scaleEnemyStatsByArea(base: CoreStats, scale: AreaScaling): CoreStats {
	return {
		hp: base.hp * scale.hp,
		attack: base.attack * scale.attack,
		defence: base.defence * scale.defence,
		speed: base.speed * scale.speed,
	};
}

export function makeDefaultTrainedStats(): Record<TrainedStatType, TrainedStat> {
	return {
		attack: new TrainedStat({
			id: "attack",
			name: "Attack",
			level: 1,
			progress: 0,
			nextThreshold: 50,
			assignedPoints: 0,
			baseGainRate: 1,
			status: "Unlocked",
			statMod: { power: 1 },
		}),
		agility: new TrainedStat({
			id: "agility",
			name: "Agility",
			level: 1,
			progress: 0,
			nextThreshold: 100,
			assignedPoints: 0,
			baseGainRate: 0.5,
			status: "Unlocked",
			statMod: { evasion: 1 },
		}),
		crit: new TrainedStat({
			id: "crit",
			name: "Crit",
			level: 1,
			progress: 0,
			nextThreshold: 100,
			assignedPoints: 0,
			baseGainRate: 0.5,
			status: "Hidden",
			statMod: { critChance: 1 },
		}),
	};
}
