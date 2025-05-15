import { BaseCharacter } from "./BaseCharacter";
import { defaultPlayerStats, PlayerStats } from "./Stats";
import { StatsEngine } from "@/core/StatsEngine";
import { calcPlayerDamage, calcPlayerDefence } from "./DamageCalculator";
import { bus } from "@/core/EventBus";
import { Ability } from "./Ability";
import { BigNumber } from "./utils/BigNumber";

interface PlayerCharacterSaveState {}

export class PlayerCharacter extends BaseCharacter {
	readonly statsEngine: StatsEngine;
	private readonly RECOVERY_HEAL = 0.01;

	constructor() {
		const base: PlayerStats = defaultPlayerStats;
		super("You", 1, base);
		this.statsEngine = new StatsEngine(base);
		this.abilities.push(Ability.create("basic_heal"));

		/* pre‑register empty layers */
		this.statsEngine.setLayer("level", () => ({}));
		this.statsEngine.setLayer("equipment", () => ({}));
		this.statsEngine.setLayer("classCard", () => ({}));
		this.statsEngine.setLayer("buffs", () => ({}));

		bus.emit("player:statsChanged");
	}

	healInRecovery() {
		this.hp.increase(this.maxHp.multiply(this.RECOVERY_HEAL)); // Always heal at least 1
	}

	get attack() {
		return calcPlayerDamage(this);
	}

	override calculateAbilityDamage(abilityDamage: number): BigNumber {
		return calcPlayerDamage(this, abilityDamage);
	}

	get defence() {
		return calcPlayerDefence(this);
	}
	get speed() {
		return this.statsEngine.get("speed");
	}

	protected getAvatarUrl(): string {
		return "/assets/avatars/player.png";
	}
}
