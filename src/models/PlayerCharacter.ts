import { BaseCharacter } from "./BaseCharacter";
import { StatsEngine } from "@/core/StatsEngine";
import { bus } from "@/core/EventBus";
import { BigNumber } from "./utils/BigNumber";

export class PlayerCharacter extends BaseCharacter {
	readonly statsEngine: StatsEngine;
	private readonly RECOVERY_HEAL = 0.01;
	private classCardAbilityIds: string[] = [];

	constructor() {
		const engine = new StatsEngine();
		super("You", { get: (k) => engine.get(k) });
		this.statsEngine = engine;
	}

	public init() {
		/* pre‑register empty layers */
		this.statsEngine.setLayer("level", () => ({}));
		this.statsEngine.setLayer("equipment", () => ({}));
		this.statsEngine.setLayer("trainedStats", () => ({}));
		this.statsEngine.setLayer("classCard", () => ({}));
		this.statsEngine.setLayer("buffs", () => ({}));

		this.defaultAbilityIds.push("basic_heal");
		this.recalculateAbilities();

		bus.emit("player:statsChanged");
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

	get attack() {
		return this.statsEngine.get("attack");
	}

	get speed() {
		return this.statsEngine.get("speed");
	}

	override getAvatarUrl(): string {
		return "/images/player/player-avatar-01.png";
	}
}
