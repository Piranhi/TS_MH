import { Bounded } from "./value-objects/Bounded";
import { BaseCharacter } from "./BaseCharacter";
import { PlayerStats } from "./Stats";
import { StatsEngine } from "@/core/StatsEngine";
import { calcPlayerDamage } from "./DamageCalculator";
import { bus } from "@/core/EventBus";

interface PlayerCharacterSaveState {}

export class PlayerCharacter extends BaseCharacter {
	readonly stats: StatsEngine;
	private readonly RECOVERY_HEAL = 0.01;
	private readonly newPlayerStats: PlayerStats = {
		attack: 2,
		defence: 2,
		speed: 1,
		hp: 120,
		attackFlat: 0,
		defenceFlat: 0,
		critChance: 0.05,
		critDamage: 0.5,
		lifesteal: 0,
		encounterChance: 1,
	};

	constructor() {
		const base: PlayerStats = {
			attack: 2,
			defence: 2,
			speed: 1,
			hp: 120,
			attackFlat: 0,
			defenceFlat: 0,
			critChance: 0.05,
			critDamage: 0.5,
			lifesteal: 0,
			encounterChance: 1,
		};

		super("You", 1, base);
		this.stats = new StatsEngine(base);

		/* pre‑register empty layers */
		this.stats.setLayer("level", () => ({}));
		this.stats.setLayer("equipment", () => ({}));
		this.stats.setLayer("classCard", () => ({}));
		this.stats.setLayer("buffs", () => ({}));

		bus.emit("player:statsChanged");
	}

	healInRecovery() {
		this.hp.increase(this.hp.max * this.RECOVERY_HEAL);
	}

	get attack() {
		return calcPlayerDamage(this);
	}
	get defence() {
		return this.stats.get("defence");
	}
	get speed() {
		return this.stats.get("speed");
	}

	protected getAvatarUrl(): string {
		return "/assets/avatars/player.png";
	}

	loadCharacterState() {}
	//TO ADD
	/* 	saveCharacterState(): PlayerCharacterSaveState {
		return;
	} */
}
