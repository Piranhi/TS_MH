import { bus } from "@/core/EventBus";
import { Player } from "@/models/player";
import { PlayerStats, StatsModifier } from "@/models/Stats";
import { Equipment } from "./Equipment";
import { InventoryManager } from "@/features/inventory/InventoryManager";
import { BigNumber } from "./utils/BigNumber";

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
		pc.statsEngine.setLayer("equipment", () => merged);
	}

	private clearBonuses() {}

	public combineDuplicates() {}
}

// Assumes every field in a and b is a BigNumber or undefined
function mergeStats(a: StatsModifier, b: StatsModifier): StatsModifier {
	const out: StatsModifier = { ...a };
	for (const k in b) {
		const key = k as keyof PlayerStats;
		const aVal = out[key];
		const bVal = b[key];

		// Defensive: if either is missing, treat as zero
		if (aVal === undefined && bVal === undefined) continue;

		const left = aVal ?? new BigNumber(0);
		const right = bVal ?? new BigNumber(0);

		// All stats are BigNumber now, so just add
		out[key] = left.add(right);
	}
	return out;
}
