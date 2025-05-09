import { bus } from "@/EventBus";
import { InventoryManager } from "../inventory/InventoryManager";
import { ClassCard } from "./ClassCard";
import { isClassCardItem } from "@/shared/type-guards";

export class ClassCardManager {
    constructor(private inv: InventoryManager){
        bus.on("player:classCardsChanged", () => this.recalculate());
    }

    private getEquippedCards(): ClassCard[] {
        return this.inv.getEquippedCards();

    }

    private recalculate(){

        const cards = this.getEquippedCards();
        this.clearBonuses();
        cards.forEach(card => this.applyCardBonus(card));
    }

    private clearBonuses(){

    }
    private applyCardBonus(card: ClassCard){
        const bonus = card.getBonuses();
        console.log(bonus)
    }

    public combineDuplicates(){

    }

}