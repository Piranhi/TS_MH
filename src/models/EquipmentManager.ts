import { bus } from "@/core/EventBus";
import { Player } from "@/models/player";
import { StatsModifier } from "@/models/Stats";
import { Equipment } from "./Equipment";
import { mergeStatModifiers, scaleStatsModifier } from "@/shared/utils/stat-utils";

export class EquipmentManager {
	constructor() {
		bus.on("player:equipmentChanged", () => this.recalculate());
		bus.on("game:gameLoaded", () => this.recalculate());
	}

	private getEquippedEquipment(): Equipment[] {
		return Player.getInstance().inventory.getEquippedEquipment();
	}

	private recalculate() {
		this.clearBonuses();
		const merged = this.getEquippedEquipment()
			.map((eq) => scaleStatsModifier(eq.statMod, eq.rarity ?? "common"))
			.reduce(mergeStatModifiers, {} as StatsModifier);

		const pc = Player.getInstance().getPlayerCharacter();
		pc.statsEngine.setLayer("equipment", () => merged);
	}
	/* 
	public printStats(stats: Partial<Stats>): void {
		console.table(this.getAll());
	} */

	private clearBonuses() {}

	public combineDuplicates() {}
}
