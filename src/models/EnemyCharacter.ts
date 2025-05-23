import { BaseCharacter } from "./BaseCharacter";
import { Monster } from "@/models/Monster";
import { CoreStats, Stats } from "./Stats";
import { debugManager, printLog } from "@/core/DebugManager";

export class EnemyCharacter extends BaseCharacter {
	public readonly spec: Monster;

	constructor(spec: Monster) {
		const scaledStats: Stats = {
			attack: spec.scaledStats.attack,
			defence: spec.scaledStats.defence,
			speed: spec.scaledStats.speed,
			hp: spec.scaledStats.hp,
			power: 0,
			guard: 0,
			critChance: 0,
			critDamage: 0,
			evasion: 0,
			lifesteal: 0,
			encounterChance: 0,
		};
		super(spec.displayName, {
			get: (statKey) => scaledStats[statKey],
		});
		const defaultAbilities = spec.abilities ?? ["basic_melee"];
		this.updateAbilities(defaultAbilities);
		this.spec = spec;
		this.canAttack = debugManager.debugActive ? debugManager.enemyCanAttack : true;
		this.canTakeDamage = debugManager.debugActive ? debugManager.enemyCanTakeDamage : true;
		this.canDie = debugManager.debugActive ? debugManager.enemyCanDie : true;
	}

	override getAvatarUrl(): string {
		return this.spec.imgUrl;
	}
}
