import { StatsModifier, CoreStats, PlayerStats } from "@/models/Stats";
import { bus } from "./EventBus";
import { BigNumber } from "@/models/utils/BigNumber";

export type LayerFn = () => StatsModifier;

/**
 * Generic so you can plug in CoreStats or PlayerStats.
 * S must be an object whose fields are numeric.
 */
export class StatsEngine {
	private layers: Record<string, LayerFn> = {};
	private readonly base: PlayerStats;
	private current: PlayerStats;

	constructor(base: PlayerStats) {
		this.base = { ...base };
		this.current = { ...base };
	}

	setLayer(name: string, fn: LayerFn): void {
		this.layers[name] = fn;
		this.recalculate();
	}

	removeLayer(name: string): void {
		delete this.layers[name];
		this.recalculate();
	}

	get<K extends keyof PlayerStats>(key: K): PlayerStats[K] {
		return this.current[key] ?? new BigNumber(0);
	}

	getAll(): PlayerStats {
		return { ...this.current };
	}

	private recalculate(): void {
		let agg: PlayerStats = { ...this.base };
		for (const fn of Object.values(this.layers)) {
			agg = mergeStats(agg, fn()) as PlayerStats;
		}
		this.current = agg;
		bus.emit("player:statsChanged");
	}

	public printStats(): void {
		console.table(this.getAll());
	}
}

function mergeStats(a: PlayerStats, b: Partial<PlayerStats>): PlayerStats {
	const out = { ...a } as PlayerStats;
	for (const k in b) {
		const key = k as keyof PlayerStats;
		const aVal = out[key];
		const bVal = b[key];
		out[key] = (aVal ?? new BigNumber(0)).add(bVal ?? new BigNumber(0));
	}
	return out;
}
