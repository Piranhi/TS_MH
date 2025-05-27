import { Stats, StatsModifier } from "@/models/Stats";
import { BigNumber } from "@/models/utils/BigNumber";
import { ItemRarity } from "../types";
import { BaseCharacter } from "@/models/BaseCharacter";
import { RARITY_MULTIPLIERS } from "@/balance/GameBalance";

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

// Assumes every field in a and b is a BigNumber or undefined
export function mergeStatModifiers(a: StatsModifier, b: StatsModifier): StatsModifier {
	const out: StatsModifier = { ...a };
	for (const k in b) {
		const key = k as keyof Stats;
		const aVal = out[key];
		const bVal = b[key];

		// Defensive: if either is missing, treat as zero
		if (aVal === undefined && bVal === undefined) continue;

		const left = aVal ?? 0;
		const right = bVal ?? 0;

		// All stats are numbers now, so just add
		out[key] = left + right;
	}
	return out;
}

/*Merge player stats*/
export function mergeStats(a: Stats, b: Partial<Stats>): Stats {
	const out = { ...a } as Stats;
	for (const k in b) {
		const key = k as keyof Stats;
		const aVal = out[key];
		const bVal = b[key];

		out[key] = (aVal ?? 0) + (bVal ?? 0);
	}
	return out;
}

export function rarityAffect(rarity: ItemRarity, stat: number): number {
	const multi = RARITY_MULTIPLIERS[rarity];
	return stat * multi;
}

export function scaleStatsModifier(mod: StatsModifier, rarity: ItemRarity): StatsModifier {
	const scaled: StatsModifier = {};
	for (const key in mod) {
		// `key` is one of the Stats keys (like "strength", "dexterity", etc.)
		const statKey = key as keyof StatsModifier;
		const baseValue = mod[statKey] ?? 0;
		scaled[statKey] = rarityAffect(rarity, baseValue);
	}
	return scaled;
}

/** Helper: roll crit/variance, apply power multipliers, etc. */
export function calculateRawBaseDamage(char: BaseCharacter): BigNumber {
	// LEVEL * ATTACK * POWER
	//const level = char.level;
	const attack = new BigNumber(char.stats.get("attack"));
	const powerMultiplier = 1 + char.stats.get("power") / 100;

	// for a damage effect: attack × power × crit × variance × effect.scale
	const totalMultiplier = powerMultiplier;
	return attack.multiply(totalMultiplier);
}
