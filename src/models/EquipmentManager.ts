import { bus } from "@/core/EventBus";
import { Player } from "@/models/player";
import { StatsModifier } from "@/models/Stats";
import { Equipment } from "./Equipment";
import { mergeStatModifiers } from "@/shared/utils/stat-utils";

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
			.map((eq) => eq.statMod)
			.reduce(mergeStatModifiers, {} as StatsModifier);

		const pc = Player.getInstance().getPlayerCharacter();
		pc.statsEngine.setLayer("equipment", () => merged);
	}

	private clearBonuses() {}

	public combineDuplicates() {}
}
