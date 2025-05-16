import { BaseCharacter } from "./BaseCharacter";
import { Monster } from "@/models/Monster";
import { CoreStats } from "./Stats";
import { printLog } from "@/core/DebugManager";

export class EnemyCharacter extends BaseCharacter {
	public readonly spec: Monster;

	constructor(spec: Monster) {
		const scaledStats: CoreStats = {
			attack: spec.scaledStats.attack,
			defence: spec.scaledStats.defence,
			speed: spec.scaledStats.speed,
			hp: spec.scaledStats.hp,
		};
		super(spec.displayName, 1, scaledStats);
		const defaultAbilities = spec.abilities ?? ["basic_melee"];
		this.updateAbilities(defaultAbilities);
		this.spec = spec;
	}
}
