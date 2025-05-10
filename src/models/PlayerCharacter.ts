import { Bounded } from "./value-objects/Bounded";
import { BaseCharacter } from "./BaseCharacter";
import { PlayerStats } from "./Stats";
import { StatsEngine } from "@/core/StatsEngine";
import { calcPlayerDamage } from "./DamageCalculator";

export class PlayerCharacter extends BaseCharacter {
	readonly stats: StatsEngine;

	constructor() {
		const base: PlayerStats = {
			attack: 2,
			defence: 2,
			speed: 1,
			maxHp: 120,
            attackFlat: 0,
            defenceFlat: 0,
			critChance: 0.05,
			critDamage: 0.5,
			lifesteal: 0,
		};
		super("You", 1, base);

        this.team = "player"
		/* 🔑 plug in the engine */
		this.stats = new StatsEngine(base);

		/* pre‑register empty layers */
		this.stats.setLayer("equipment", () => ({}));
		this.stats.setLayer("classCard", () => ({}));
		this.stats.setLayer("buffs", () => ({}));
	}

	get attack() {
		return calcPlayerDamage(this)
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
}
