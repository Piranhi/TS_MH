import { Stats, StatsModifier } from "@/models/Stats";
import { ItemRarity, Resistances } from "../types";
import { BaseCharacter } from "@/models/BaseCharacter";
import { RARITY_MULTIPLIERS } from "@/balance/GameBalance";
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
export function mergeResistances(a: Resistances, b: Partial<Resistances>): Resistances {
	return {
		fire: (a.fire ?? 0) + (b.fire ?? 0),
		ice: (a.ice ?? 0) + (b.ice ?? 0),
		poison: (a.poison ?? 0) + (b.poison ?? 0),
		lightning: (a.lightning ?? 0) + (b.lightning ?? 0),
		physical: (a.physical ?? 0) + (b.physical ?? 0),
	};
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
// Scale equipment stats by rarity and heirloom
export function scaleStatsModifier(mod: StatsModifier, rarity: ItemRarity, heirloom: number): StatsModifier {
	const scaled: StatsModifier = {};
	for (const key in mod) {
		// `key` is one of the Stats keys (like "strength", "dexterity", etc.)
		const statKey = key as keyof StatsModifier;
		const baseValue = mod[statKey] ?? 0;
		scaled[statKey] = rarityAffect(rarity, baseValue) + (heirloom ? heirloom : 0); //(1 + heirloom / 100);
	}
	return scaled;
}

/** Helper: roll crit/variance, apply power multipliers, etc. */
export function calculateRawBaseDamage(char: BaseCharacter): number {
	// LEVEL * ATTACK * POWER
	//const level = char.level;
	const attack = char.stats.get("attack");
	const powerMultiplier = 1 + char.stats.get("power") / 100;

	const totalMultiplier = powerMultiplier;
	return attack * totalMultiplier;
}
