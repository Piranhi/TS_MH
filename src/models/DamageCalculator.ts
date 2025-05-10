import { PlayerCharacter } from "./PlayerCharacter";

export function calcPlayerDamage(player: PlayerCharacter): number{
    const base = player.stats.get("attack");
    const flat = player.stats.get("attackFlat")
    const multi = 1;

    const result = (base + flat) * multi;
    console.log("Calculated Damage: " + result);
    return result;
}