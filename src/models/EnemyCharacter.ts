import { BaseCharacter } from "./BaseCharacter";
import { Monster } from "@/models/Monster";
import { debugManager } from "@/core/DebugManager";
import { GAME_BALANCE } from "@/balance/GameBalance";
import { MonsterAffinityType, ElementType } from "@/shared/types";

export class EnemyCharacter extends BaseCharacter {
	public readonly spec: Monster;

	constructor(spec: Monster) {
		super(
			spec.displayName,
			{
				// Scaled by area
				get: (statKey) => spec.areaScaledStats[statKey],
			},
			spec.affinities
		);
		this.spec = spec;
		this.setupAbilities();
		this.setupAffinities();

		this._type = "ENEMY";
		this.stamina.setMax(GAME_BALANCE.player.stamina.enemyMax);
		this.stamina.setCurrent(GAME_BALANCE.player.stamina.enemyMax);

		// Debug Options
		this.canAttack = debugManager.get("enemy_canAttack");
		this.canTakeDamage = debugManager.get("enemy_canTakeDamage");
		this.canDie = debugManager.get("enemy_canDie");
	}

	private setupAffinities() {
		//const resistanceStats: Partial<Resistances> = {};

		for (const affinity of this.affinities) {
			const resistanceKey = affinity.element as ElementType;
			const resistanceValue = this.getResistance(affinity.type);
			this.resistances.setBase(resistanceKey, resistanceValue);
			//resistanceStats[resistanceKey] = resistanceValue;
		}
		//this.resistances.setBase(resistanceStats);
	}

	private setupAbilities() {
		// Add default abilities
		for (const abilityId of this.spec.abilities) {
			this.addNewAbility(abilityId);
		}
	}

	private getResistance(affinity: MonsterAffinityType): number {
		switch (affinity) {
			case "immunity":
				return GAME_BALANCE.monsters.affinityAmounts.immunity;
			case "resistance":
				return GAME_BALANCE.monsters.affinityAmounts.resistance;
			case "weakness":
				return GAME_BALANCE.monsters.affinityAmounts.weakness; // negative = takes more damage
			case "armored":
				return GAME_BALANCE.monsters.affinityAmounts.armored; // physical resistance only
			default:
				return 0;
		}
	}

	override getAvatarUrl(): string {
		return this.spec.imgUrl;
	}
}
