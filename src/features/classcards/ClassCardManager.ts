import { bus } from "@/core/EventBus";
import { ClassCard } from "./ClassCard";
import { Player } from "@/models/player";
import { StatsModifier } from "@/models/Stats";
import { mergeStatModifiers } from "@/shared/utils/stat-utils";

export class ClassCardManager {
	constructor() {
		bus.on("player:classCardsChanged", () => this.recalculate());
		bus.on("game:gameLoaded", () => this.recalculate());
	}

	private getEquippedCards(): ClassCard[] {
		return Player.getInstance().inventory.getEquippedCards();
	}

	private recalculate() {
		this.clearBonuses();
		const merged = this.getEquippedCards()
			.map((card) => card.getBonuses())
			.reduce(mergeStatModifiers, {} as StatsModifier);

		const abilities = this.getEquippedCards().flatMap((card) => card.abilities ?? []);

		const pc = Player.getInstance().getPlayerCharacter();
		pc.setClassCardAbilities(abilities);
		pc.statsEngine.setLayer("classCards", () => merged); // Update Stats Enging with new stats from cards
	}

	private clearBonuses() {}

	public combineDuplicates() {}
}
