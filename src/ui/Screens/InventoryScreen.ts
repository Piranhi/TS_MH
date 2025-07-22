import { BaseScreen } from "./BaseScreen";
import Markup from "./inventory.html?raw";
import { bus } from "@/core/EventBus";
import { InventorySlot } from "../components/InventorySlot";
import { bindEvent } from "@/shared/utils/busUtils";
import { TableDisplay } from "../components/TableDisplay";
import { prettify } from "@/shared/utils/stringUtils";
import { STAT_DISPLAY_NAMES, StatKey } from "@/models/Stats";

export class InventoryScreen extends BaseScreen {
    readonly screenName = "inventory";
    private inventoryGridEl!: HTMLElement;
    private equipmentGridEl!: HTMLElement;
    private recycleGridEl!: HTMLElement;
    private infoGridEl!: HTMLElement;
    private slotComponents = new Map<string, InventorySlot>();
    private bonusesTable!: TableDisplay;

    init() {
        this.addMarkuptoPage(Markup);
        this.inventoryGridEl = this.$(".inventory-grid");
        this.equipmentGridEl = this.$(".equipment-grid");
        this.recycleGridEl = this.$(".recycle-grid");
        this.infoGridEl = this.$(".info-grid");
        this.buildSlots();
        this.buildBonusesTable();
        this.bindEvents();
        this.renderInventory();
    }
    show() {
        this.renderInventory();
    }
    hide() {}

    private bindEvents() {
        bindEvent(this.eventBindings, "slot:drop", ({ fromId, toId }) => {
            this.context.inventory.moveItem(fromId, toId);
        });
        bindEvent(this.eventBindings, "slot:dblclick", (slotId) => {
            this.context.inventory.autoEquip(slotId);
        });
        bindEvent(this.eventBindings, "slot:ctrlclick", (slotId) => {
            this.context.inventory.moveToRecycleBin(slotId);
        });
        bindEvent(this.eventBindings, "inventory:changed", () => {
            this.rebuildSlots();
            this.renderInventory();
        });
        bindEvent(this.eventBindings, "player:equipmentChanged", () => this.renderInventory());
    }

    private renderInventory() {
        const inventory = this.context.inventory.getSlots();
        inventory.forEach((slot) => {
            this.slotComponents.get(slot.id)?.update(slot.itemState);
        });
        this.updateBonusesTable();
    }

    private buildSlots() {
        this.slotComponents.forEach((c) => c.destroy());
        this.slotComponents.clear();
        this.inventoryGridEl.innerHTML = "";
        this.equipmentGridEl.innerHTML = "";
        this.recycleGridEl.innerHTML = "";

        this.context.inventory.getSlots().forEach((slot) => {
            const comp = new InventorySlot(slot.id, slot.type, slot.itemState);
            this.slotComponents.set(slot.id, comp);
            if (slot.type === "equipment") comp.setSlotKey(String(slot.key));
            switch (slot.type) {
                case "equipment":
                    comp.attachTo(this.equipmentGridEl);
                    break;
                case "inventory":
                    comp.attachTo(this.inventoryGridEl);
                    break;
                case "recycleBin":
                    comp.attachTo(this.recycleGridEl);
                    break;
            }
        });
    }

    private rebuildSlots() {
        const slots = this.context.inventory.getSlots();
        if (slots.length !== this.slotComponents.size || slots.some((s) => !this.slotComponents.has(s.id))) {
            this.buildSlots();
        }
    }

    private buildBonusesTable() {
        const wrapper = document.createElement("div");
        wrapper.classList.add("basic-table-wrapper");
        this.infoGridEl.appendChild(wrapper);
        this.bonusesTable = new TableDisplay({
            container: wrapper,
            columns: 2,
            headers: ["Stat", "Value"],
            banded: true,
            boldFirstColumn: true,
            collapsible: false,
        });
    }

    private updateBonusesTable() {
        const bonuses = this.context.character.statsEngine.getLayerModifiers("equipment");
        this.bonusesTable.updateData(
            Object.entries(bonuses).map(([stat, value]) => [
                STAT_DISPLAY_NAMES[stat as string] || stat,
                value,
            ])
        );
    }
}
