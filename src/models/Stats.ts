import { TrainedStat } from "./TrainedStat";
import { BigNumber } from "./utils/BigNumber";

export interface CoreStats {
	attack: BigNumber;
	defence: BigNumber;
	speed: BigNumber;
	hp: BigNumber;
}

export interface CoreStatsNumbers {
	attack: number;
	defence: number;
	speed: number;
	hp: number;
}

/** Extra stats that only the player uses */
export interface PlayerExtras {
	attackFlat: BigNumber;
	attackMulti: BigNumber;
	defenceFlat: BigNumber;
	defenceMulti: BigNumber;
	critChance: BigNumber;
	critDamage: BigNumber;
	speedMulti: BigNumber;
	lifesteal: BigNumber;
	encounterChance: BigNumber;
}
export interface PlayerExtraNumbers {
	attackFlat: number;
	attackMulti: number;
	defenceFlat: number;
	defenceMulti: number;
	critChance: number;
	critDamage: number;
	speedMulti: number;
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
}

export const defaultPlayerStats: PlayerStats = {
	attack: new BigNumber(1),
	defence: new BigNumber(1),
	speed: new BigNumber(1),
	hp: new BigNumber(1000),
	attackFlat: new BigNumber(1),
	attackMulti: new BigNumber(1),
	defenceFlat: new BigNumber(1),
	defenceMulti: new BigNumber(1),
	critChance: new BigNumber(1),
	critDamage: new BigNumber(1),
	speedMulti: new BigNumber(1),
	lifesteal: new BigNumber(1),
	encounterChance: new BigNumber(1),
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
export type PlayerStatsNumber = CoreStatsNumbers & PlayerExtraNumbers;
export type StatsModifier = Partial<PlayerStats>;
export type StatsModifierNumber = Partial<PlayerStatsNumber>;
export type TrainedStatType = "attack" | "agility" | "crit";
export type TrainedStatStatus = "Unlocked" | "Locked" | "Hidden";

export function toCoreStats(numbers: CoreStatsNumbers): CoreStats {
	return {
		hp: new BigNumber(numbers.hp),
		attack: new BigNumber(numbers.attack),
		defence: new BigNumber(numbers.defence),
		speed: new BigNumber(numbers.speed),
	};
}

export function scaleEnemyStatsByArea(base: CoreStats, scale: AreaScaling): CoreStats {
	return {
		hp: base.hp.multiply(scale.hp),
		attack: base.attack.multiply(scale.attack),
		defence: base.defence.multiply(scale.defence),
		speed: base.speed.multiply(scale.speed),
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
