import { BaseCharacter } from "./BaseCharacter";
import { Monster } from "@/models/Monster";
import { CoreStats } from "./Stats";
import { printLog } from "@/core/DebugManager";

export class EnemyCharacter extends BaseCharacter {
	public readonly spec: Monster;

	constructor(spec: Monster) {
		const stats: CoreStats = {
			attack: spec.scaledStats.attack,
			defence: spec.scaledStats.defence,
			speed: spec.scaledStats.speed,
			hp: spec.scaledStats.hp,
		};
		super(spec.displayName, 1, stats);
		this.spec = spec;
		printLog("Monster created: " + JSON.stringify(stats), 3, "EnemyCharacter.ts");
	}
}
