import { StatsModifier, CoreStats, PlayerStats } from "@/models/Stats";
import { PlayerbarDisplay } from "@/ui/components/PlayerBarDisplay";
import { bus } from "./EventBus";

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

	get<K extends keyof PlayerStats>(key: K): number {
		return (this.current[key] as number) || 0;
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
	}

	public printStats(): void {
		console.table(this.getAll());
	}
}

function mergeStats(a: StatsModifier, b: StatsModifier): StatsModifier {
	const out: StatsModifier = { ...a };
	for (const k in b) {
		const key = k as keyof PlayerStats;
		out[key] = (out[key] ?? 0) + (b[key] ?? 0);
	}
	return out;
}
