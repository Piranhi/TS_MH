import { CoreStats, CoreStatsNumbers, PlayerStats, StatsModifier } from "@/models/Stats";
import { BigNumber } from "@/models/utils/BigNumber";

// Convert any object of numbers to BigNumbers
export function toBigNumberStats<T extends Record<string, number>>(raw: T): { [K in keyof T]: BigNumber } {
	const out = {} as { [K in keyof T]: BigNumber };
	for (const k in raw) {
		out[k] = new BigNumber(raw[k]);
	}
	return out;
}

// Accepts mixed types, skips anything already a BigNumber
export function toBigNumberModifier<T extends Record<string, number | BigNumber | undefined>>(raw: T): { [K in keyof T]: BigNumber } {
	const out = {} as { [K in keyof T]: BigNumber };
	for (const k in raw) {
		const val = raw[k];
		if (val instanceof BigNumber) {
			out[k] = val;
		} else if (typeof val === "number") {
			out[k] = new BigNumber(val);
		} else {
			out[k] = new BigNumber(0); // default for undefined, or skip this line if you want sparse
		}
	}
	return out;
}

// Helper:
function toCoreStats(stats: CoreStatsNumbers): CoreStats {
	return {
		attack: new BigNumber(stats.attack),
		defence: new BigNumber(stats.defence),
		speed: new BigNumber(stats.speed),
		hp: new BigNumber(stats.hp),
	};
}

// Assumes every field in a and b is a BigNumber or undefined
export function mergeStatModifiers(a: StatsModifier, b: StatsModifier): StatsModifier {
	const out: StatsModifier = { ...a };
	for (const k in b) {
		const key = k as keyof PlayerStats;
		const aVal = out[key];
		const bVal = b[key];

		// Defensive: if either is missing, treat as zero
		if (aVal === undefined && bVal === undefined) continue;

		const left = aVal ?? new BigNumber(0);
		const right = bVal ?? new BigNumber(0);

		// All stats are BigNumber now, so just add
		out[key] = left.add(right);
	}
	return out;
}
