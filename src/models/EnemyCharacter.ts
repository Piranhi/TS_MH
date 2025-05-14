import { Bounded } from "./value-objects/Bounded";
import { BaseCharacter } from "./BaseCharacter";
import { Monster } from "@/models/Monster";
import { CoreStats } from "./Stats";
import { printLog } from "@/core/DebugManager";

export class EnemyCharacter extends BaseCharacter {
	public readonly monster: Monster;

	constructor(monster: Monster) {
		const stats: CoreStats = {
			attack: monster.scaledStats.attack,
			defence: monster.scaledStats.defence,
			speed: monster.scaledStats.speed,
			hp: monster.scaledStats.hp,
		};
		super(monster.displayName, 1, stats);
		this.monster = monster;
		printLog("Monster created: " + JSON.stringify(stats), 3, "EnemyCharacter.ts");
	}
}
