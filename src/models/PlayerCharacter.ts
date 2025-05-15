import { BaseCharacter, CharacterSnapsnot } from "./BaseCharacter";
import { defaultPlayerStats, PlayerStats } from "./Stats";
import { StatsEngine } from "@/core/StatsEngine";
import { calcPlayerDamage, calcPlayerDefence } from "./DamageCalculator";
import { bus } from "@/core/EventBus";
import { Saveable } from "@/shared/storage-types";
import { Attack } from "./Attack";

interface PlayerCharacterSaveState {}

export class PlayerCharacter extends BaseCharacter {
	readonly stats: StatsEngine;
	private readonly RECOVERY_HEAL = 0.01;
	//private readonly newPlayerStats: PlayerStats = defaultPlayerStats;

	constructor() {
		const base: PlayerStats = defaultPlayerStats;
		super("You", 1, base);
		this.stats = new StatsEngine(base);
		this.attacks.push(Attack.create("basic_heal"));

		/* pre‑register empty layers */
		this.stats.setLayer("level", () => ({}));
		this.stats.setLayer("equipment", () => ({}));
		this.stats.setLayer("classCard", () => ({}));
		this.stats.setLayer("buffs", () => ({}));

		bus.emit("player:statsChanged");
	}

	healInRecovery() {
		this.hp.increase(Math.max(this.maxHp * this.RECOVERY_HEAL, 1)); // Always heal at least 1
	}

	get attack() {
		return calcPlayerDamage(this);
	}
	get defence() {
		return calcPlayerDefence(this);
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
