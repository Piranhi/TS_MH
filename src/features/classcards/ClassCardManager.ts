import { bus } from "@/core/EventBus";
import { InventoryManager } from "../inventory/InventoryManager";
import { ClassCard } from "./ClassCard";
import { Player } from "@/models/player";
import { PlayerStats, StatsModifier } from "@/models/Stats";
import { BigNumber } from "@/models/utils/BigNumber";

export class ClassCardManager {
	constructor(private inv: InventoryManager) {
		bus.on("player:classCardsChanged", () => this.recalculate());
		bus.on("game:gameLoaded", () => this.recalculate());
	}

	private getEquippedCards(): ClassCard[] {
		return this.inv.getEquippedCards();
	}

	private recalculate() {
		this.clearBonuses();
		const merged = this.getEquippedCards()
			.map((card) => card.getBonuses())
			.reduce(mergeStats, {} as StatsModifier);

		const pc = Player.getInstance().getPlayerCharacter();
		pc.statsEngine.setLayer("classCards", () => merged);
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
