import { bus } from "@/core/EventBus";
import { ClassCard } from "./ClassCard";
import { StatsModifier } from "@/models/Stats";
import { mergeStatModifiers } from "@/shared/utils/stat-utils";
import { GameContext } from "@/core/GameContext";

export class ClassCardManager {
	private context = GameContext.getInstance();

	constructor() {
		bus.on("player:classCardsChanged", () => this.recalculate());
		bus.on("game:gameLoaded", () => this.recalculate());
	}

	private getEquippedCards(): ClassCard[] {
		return this.context.inventory.getEquippedCards();
	}

	private recalculate() {
		this.clearBonuses();
		const merged = this.getEquippedCards()
			.map((card) => card.getBonuses())
			.reduce(mergeStatModifiers, {} as StatsModifier);

		const abilities = this.getEquippedCards().flatMap((card) => card.abilities ?? []);

		this.context.character.setClassCardAbilities(abilities);
		this.context.character.statsEngine.setLayer("classCards", () => merged); // Update Stats Enging with new stats from cards
	}

	private clearBonuses() {}

	public combineDuplicates() {}
}
