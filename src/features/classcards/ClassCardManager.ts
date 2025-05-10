import { bus } from "@/core/EventBus";
import { InventoryManager } from "../inventory/InventoryManager";
import { ClassCard } from "./ClassCard";
import { Player } from "@/models/player";
import { PlayerStats, StatsModifier } from "@/models/Stats";

export class ClassCardManager {
	constructor(private inv: InventoryManager) {
		bus.on("player:classCardsChanged", () => this.recalculate());
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
		pc.stats.setLayer("classCards", () => merged);
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
