import { StatsModifier, CoreStats, Stats, defaultPlayerStats } from "@/models/Stats";
import { bus } from "./EventBus";
import { BigNumber } from "@/models/utils/BigNumber";
import { mergeStats } from "@/shared/utils/stat-utils";

export type LayerFn = () => StatsModifier;

/**
 * Generic so you can plug in CoreStats or PlayerStats.
 * S must be an object whose fields are numeric.
 */
export class StatsEngine {
	private layers: Record<string, LayerFn> = {};
	private readonly base: Stats;
	private current: Stats;

	constructor() {
		this.base = { ...defaultPlayerStats };
		this.current = { ...defaultPlayerStats };
	}

	setLayer(name: string, fn: LayerFn): void {
		this.layers[name] = fn;
		this.recalculate();
	}

	removeLayer(name: string): void {
		delete this.layers[name];
		this.recalculate();
	}

	get<K extends keyof Stats>(key: K): Stats[K] {
		return this.current[key] ?? new BigNumber(0);
	}

	getAll(): Stats {
		return { ...this.current };
	}

	private recalculate(): void {
		let agg: Stats = { ...this.base };
		for (const fn of Object.values(this.layers)) {
			agg = mergeStats(agg, fn()) as Stats;
		}
		this.current = agg;
		bus.emit("player:statsChanged");
	}

	public printStats(): void {
		console.table(this.getAll());
	}
}
