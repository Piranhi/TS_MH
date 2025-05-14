import { bus } from "@/core/EventBus";
import { Player } from "@/models/player";
import { PlayerStats, StatsModifier } from "@/models/Stats";
import { Equipment } from "./Equipment";
import { InventoryManager } from "@/features/inventory/InventoryManager";

export class EquipmentManager {
	constructor(private inv: InventoryManager) {
		bus.on("player:equipmentChanged", () => this.recalculate());
		bus.on("game:gameLoaded", () => this.recalculate());
	}

	private getEquippedEquipment(): Equipment[] {
		return this.inv.getEquippedEquipment();
	}

	private recalculate() {
		this.clearBonuses();
		const merged = this.getEquippedEquipment()
			.map((eq) => eq.statMod)
			.reduce(mergeStats, {} as StatsModifier);

		const pc = Player.getInstance().getPlayerCharacter();
		pc.stats.setLayer("equipment", () => merged);
	}

	private clearBonuses() {}

	public combineDuplicates() {}
}

function mergeStats(a: StatsModifier, b: StatsModifier): StatsModifier {
	const out: StatsModifier = { ...a };
	for (const k in b) {
		const key = k as keyof PlayerStats;
		out[key] = (out[key] ?? 0) + (b[key] ?? 0);
	}
	return out;
}
