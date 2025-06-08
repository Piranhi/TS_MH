// ===================================================
// Updated EquipmentManager.ts
// ===================================================
import { bus } from "@/core/EventBus";
import { StatsModifier } from "@/models/Stats";
import { Equipment } from "./Equipment";
import { mergeStatModifiers } from "@/shared/utils/stat-utils";
import { GameContext } from "@/core/GameContext";
import { Destroyable } from "../core/Destroyable";

export class EquipmentManager extends Destroyable {
    private context: GameContext;

    constructor() {
        super();
        this.context = GameContext.getInstance();
        bus.on("player:equipmentChanged", () => this.recalculate());
        bus.on("game:gameLoaded", () => this.recalculate());
    }

    private getEquippedEquipment(): Equipment[] {
        return this.context.inventory.getEquippedEquipment();
    }

    private recalculate() {
        const equippedItems = this.getEquippedEquipment();

        // Calculate total stat bonuses from equipment
        const statBonuses = equippedItems.map((eq) => eq.getBonuses()).reduce(mergeStatModifiers, {} as StatsModifier);

        // Apply to character if we have an active run
        if (this.context.currentRun) {
            const character = this.context.character;
            character.statsEngine.setLayer("equipment", () => statBonuses);
        }
    }
}
