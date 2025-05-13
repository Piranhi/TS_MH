import { bus } from "@/core/EventBus";
import { Saveable } from "@/shared/storage-types";

export const ALL_STATS = ["monstersKilled", "deaths"];

export type LifetimeStatType = (typeof ALL_STATS)[number];

export interface LifetimeStatsSaveState {
	stats: Record<LifetimeStatType, number>;
}

export class LifetimeStats implements Saveable {
	private stats: Record<LifetimeStatType, number>;

	constructor() {
		this.stats = Object.fromEntries(ALL_STATS.map((stat) => [stat, 0])) as Record<LifetimeStatType, number>;
		bus.on("lifetimeStat:add", ({ stat, amt }) => {
			this.addStat(stat, amt);
		});
	}

	public addStat(stat: LifetimeStatType, amount: number): void {
		this.stats[stat] += amount;
	}

	public getStat(stat: LifetimeStatType): number {
		return this.stats[stat];
	}

	save(): LifetimeStatsSaveState {
		return { stats: this.stats };
	}

	load(state: LifetimeStatsSaveState): void {
		this.stats = state.stats;
	}
}
