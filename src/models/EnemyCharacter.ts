// src/models/EnemyCharacter.ts
import { BaseCharacter } from "./BaseCharacter";
import { Monster } from "@/models/Monster";
import { debugManager } from "@/core/DebugManager";
import { GAME_BALANCE } from "@/balance/GameBalance";
import { MonsterAffinityType, ElementType } from "@/shared/types";

export class EnemyCharacter extends BaseCharacter {
	public readonly spec: Monster;

	constructor(spec: Monster) {
		// Call parent with enemy stats provider
		super(
			spec.displayName,
			{
				// Area-scaled stats
				get: (statKey) => spec.areaScaledStats[statKey] || 0,
			},
			spec.affinities
		);

		this.spec = spec;
		this._type = "ENEMY";

		// Setup enemy specifics
		this.setupAbilities();
		this.setupAffinities();
		this.setupStamina();

		// Initialize HP after everything is setup
		this.initializeHP();
	}

	private initializeHP() {
		const maxHp = this.stats.get("hp");
		this.hp.setMax(maxHp);
		this.hp.setCurrent(maxHp);
	}

	private setupStamina() {
		this.stamina.setMax(GAME_BALANCE.player.stamina.enemyMax);
		this.stamina.setCurrent(GAME_BALANCE.player.stamina.enemyMax);
	}

	protected override checkDebugOptions() {
		this.canAttack = debugManager.get("enemy_canAttack");
		this.canTakeDamage = debugManager.get("enemy_canTakeDamage");
		this.canDie = debugManager.get("enemy_canDie");
	}

	private setupAffinities() {
		// Set base resistances based on affinities
		for (const affinity of this.affinities) {
			const resistanceKey = affinity.element as ElementType;
			const resistanceValue = this.getResistance(affinity.type);
			this.resistances.setBase(resistanceKey, resistanceValue);
		}
	}

	private setupAbilities() {
		// Add abilities from spec
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

	// Override to prevent NaN issues with missing stats
	override get maxHp(): number {
		return this.hp.max || 100; // Fallback value
	}

	override get currentHp(): number {
		return this.hp.current || 0;
	}
}
