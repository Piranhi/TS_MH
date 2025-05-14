import { PlayerCharacter } from "./PlayerCharacter";

export function calcPlayerDamage(player: PlayerCharacter): number {
	const base = player.stats.get("attack");
	const flat = player.stats.get("attackFlat");
	const multi = player.stats.get("attackMulti");

	const result = (base + flat) * multi;
	return result;
}

export function calcPlayerDefence(player: PlayerCharacter): number {
	const base = player.stats.get("defence");
	const flat = player.stats.get("defenceFlat");
	const multi = player.stats.get("defenceMulti");

	const result = (base + flat) * multi;
	return result;
}
