import { bus } from "@/core/EventBus";
import { InventoryManager } from "../inventory/InventoryManager";
import { ClassCard } from "./ClassCard";
import { Player } from "@/models/player";
import { PlayerStats, StatsModifier } from "@/models/Stats";
import { BigNumber } from "@/models/utils/BigNumber";
import { mergeStatModifiers } from "@/shared/utils/stat-utils";

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
			.reduce(mergeStatModifiers, {} as StatsModifier);

		const pc = Player.getInstance().getPlayerCharacter();
		pc.statsEngine.setLayer("classCards", () => merged);
	}

	private clearBonuses() {}

	public combineDuplicates() {}
}


