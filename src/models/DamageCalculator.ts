import { printLog } from "@/core/DebugManager";
import { PlayerCharacter } from "./PlayerCharacter";
import { BigNumber } from "./utils/BigNumber";

export function calcPlayerDamage(player: PlayerCharacter, abilityDamage: number = 0): BigNumber {
	const base = player.statsEngine.get("attack").add(abilityDamage);
	const flat = player.statsEngine.get("attackFlat");
	const multi = player.statsEngine.get("attackMulti");
	const result: BigNumber = base.add(flat).multiply(multi);

	printLog(`Calc Player Damage: Base:[${base}], Flat:[${flat}], Multi:[${multi}], Result: [${result}]`, 4, "DamageCalculator.ts");
	return result;
}

export function calcPlayerDefence(player: PlayerCharacter): BigNumber {
	const base = player.statsEngine.get("defence");
	const flat = player.statsEngine.get("defenceFlat");
	const multi = player.statsEngine.get("defenceMulti");

	const result: BigNumber = base.add(flat).multiply(multi);
	return result;
}
