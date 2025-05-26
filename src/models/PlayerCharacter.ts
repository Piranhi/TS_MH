import { BaseCharacter } from "./BaseCharacter";
import { StatsEngine } from "@/core/StatsEngine";
import { bus } from "@/core/EventBus";
import { PrestigeState } from "@/shared/stats-types";
import { GameContext } from "@/core/GameContext";
import { bindEvent } from "@/shared/utils/busUtils";
import { BigNumber } from "./utils/BigNumber";

export class PlayerCharacter extends BaseCharacter {
	readonly statsEngine: StatsEngine;
	private readonly RECOVERY_HEAL = 0.01;

	private passiveHealTick = 0;
	private classCardAbilityIds: string[] = [];

	constructor(prestigeStats: PrestigeState) {
		const engine = new StatsEngine();
		super("You", { get: (k) => engine.get(k) });
		this.statsEngine = engine;
		/* pre‑register empty layers */
		this.statsEngine.setLayer("level", () => ({}));
		this.statsEngine.setLayer("prestige", () => ({
			attack: prestigeStats.permanentAttack,
			defence: prestigeStats.permanentDefence,
			hp: prestigeStats.permanentHP,
		}));
		this.statsEngine.setLayer("equipment", () => ({}));
		this.statsEngine.setLayer("trainedStats", () => ({}));
		this.statsEngine.setLayer("classCard", () => ({}));
		this.statsEngine.setLayer("buffs", () => ({}));
		bindEvent(this.eventBindings, "Game:GameTick", () => this.passiveHeal());
	}

	public init() {
		this.defaultAbilityIds.push("basic_heal");
		this.recalculateAbilities();
		bus.emit("player:statsChanged");
	}

	private passiveHeal() {
		this.passiveHealTick++;

		this.hp.increase(new BigNumber(1));
	}

	healInRecovery() {
		this.hp.increase(this.maxHp.multiply(this.RECOVERY_HEAL)); // Always heal at least 1
	}

	public setClassCardAbilities(abilityIds: string[]) {
		this.classCardAbilityIds = abilityIds;
		this.recalculateAbilities();
	}
	/** Recalculate full ability set and update map */
	private recalculateAbilities() {
		// Merge all sources (dedupe with Set)
		const mergedIds = Array.from(
			new Set([
				...(this.defaultAbilityIds ?? []),
				...this.classCardAbilityIds,
				// ...add more here if needed
			])
		);
		this.updateAbilities(mergedIds);
	}

	get level(): number {
		return GameContext.getInstance().player.playerLevel;
	}

	override getAvatarUrl(): string {
		return "/images/player/player-avatar-01.png";
	}
}
