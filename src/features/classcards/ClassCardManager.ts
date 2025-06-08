// ===================================================
// Updated ClassCardManager.ts
// ===================================================
import { bus } from "@/core/EventBus";
import { ClassCard } from "./ClassCard";
import { StatsModifier } from "@/models/Stats";
import { mergeStatModifiers } from "@/shared/utils/stat-utils";
import { GameContext } from "@/core/GameContext";
import { Destroyable } from "@/core/Destroyable";

export class ClassCardManager extends Destroyable {
    private context: GameContext;

    constructor() {
        super();
        this.context = GameContext.getInstance();
        bus.on("player:classCardsChanged", () => this.recalculate());
        bus.on("game:gameLoaded", () => this.recalculate());
    }

    private getEquippedCards(): ClassCard[] {
        return this.context.inventory.getEquippedCards();
    }

    private recalculate() {
        const equippedCards = this.getEquippedCards();

        // Calculate stat bonuses from cards
        const statBonuses = equippedCards.map((card) => card.getBonuses()).reduce(mergeStatModifiers, {} as StatsModifier);

        // Extract abilities from cards
        const abilities = equippedCards.flatMap((card) => card.abilities ?? []);

        // Apply to character if we have an active run
        if (this.context.currentRun) {
            const character = this.context.character;
            character.setClassCardAbilities(abilities);
            character.statsEngine.setLayer("classCards", () => statBonuses);
        }
    }
}
