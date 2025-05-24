import { bus } from "@/core/EventBus";
import { StatsModifier } from "@/models/Stats";
import { Equipment } from "./Equipment";
import { mergeStatModifiers, scaleStatsModifier } from "@/shared/utils/stat-utils";
import { GameContext } from "@/core/GameContext";

export class EquipmentManager {
	private context = GameContext.getInstance();
	constructor() {
		bus.on("player:equipmentChanged", () => this.recalculate());
		bus.on("game:gameLoaded", () => this.recalculate());
	}

	private getEquippedEquipment(): Equipment[] {
		return this.context.inventory.getEquippedEquipment();
	}

	private recalculate() {
		this.clearBonuses();
		const merged = this.getEquippedEquipment()
			.map((eq) => scaleStatsModifier(eq.statMod, eq.rarity ?? "common"))
			.reduce(mergeStatModifiers, {} as StatsModifier);

		this.context.character.statsEngine.setLayer("equipment", () => merged);
	}
	/* 
	public printStats(stats: Partial<Stats>): void {
		console.table(this.getAll());
	} */

	private clearBonuses() {}

	public combineDuplicates() {}
}
