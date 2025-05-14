import { TrainedStat } from "./TrainedStat";

export interface CoreStats {
	attack: number;
	defence: number;
	speed: number;
	hp: number;
}

/** Extra stats that only the player uses */
export interface PlayerExtras {
	attackFlat: number;
	defenceFlat: number;
	critChance: number;
	critDamage: number;
	lifesteal: number;
	encounterChance: number;

	// add more as the design grows
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
}

export const defaultCoreStats: CoreStats = {
	attack: 1,
	defence: 1,
	speed: 1,
	hp: 10,
};

export interface AreaScaling {
	hp: number;
	attack: number;
	defence: number;
	speed: number;
	dropChance: number;
	renown: number;
}

export type PlayerStats = CoreStats & PlayerExtras;
export type StatsModifier = Partial<PlayerStats>;
export type TrainedStatType = "attack" | "agility" | "crit";
export type TrainedStatStatus = "Unlocked" | "Locked" | "Hidden";

export function scaleStats(base: CoreStats, scale: AreaScaling): CoreStats {
	return {
		hp: Math.round(base.hp * scale.hp),
		attack: Math.round(base.attack * scale.attack),
		defence: Math.round(base.defence * scale.defence),
		speed: Math.round(base.speed * scale.speed),
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
		}),
	};
}
