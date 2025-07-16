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

	init() {
		this.addMarkuptoPage(Markup);
		this.inventoryGridEl = this.$(".inventory-grid");
		this.equipmentGridEl = this.$(".equipment-grid");
		this.recycleGridEl = this.$(".recycle-grid");
		this.infoGridEl = this.$(".info-grid");
		this.bindEvents();
		this.renderInventory();
	}
	show() {
		this.renderInventory();
	}
	hide() {}

	private bindEvents() {
		bindEvent(this.eventBindings, "slot:drop", ({ fromId, toId }) => {
			const changed = this.context.inventory.moveItem(fromId, toId);
			if (changed) bus.emit("inventory:changed");
		});
		bindEvent(this.eventBindings, "slot:dblclick", (slotId) => {
			const changed = this.context.inventory.autoEquip(slotId);
			if (changed) bus.emit("inventory:changed");
		});
		bindEvent(this.eventBindings, "slot:ctrlclick", (slotId) => {
			const changed = this.context.inventory.moveToRecycleBin(slotId);
			if (changed) bus.emit("inventory:changed");
		});
		bindEvent(this.eventBindings, "inventory:changed", () => this.renderInventory());
		bindEvent(this.eventBindings, "player:equipmentChanged", () => this.renderInventory());
	}

	private renderInventory() {
		const inventory = this.context.inventory.getSlots();
		this.inventoryGridEl.innerHTML = "";
		this.equipmentGridEl.innerHTML = "";
		this.recycleGridEl.innerHTML = "";

		inventory.forEach((slot) => {
			const slotComp = new InventorySlot(slot.id, slot.type, slot.itemState);
			switch (slot.type) {
				case "equipment":
					slotComp.setSlotKey(String(slot.key));
					slotComp.attachTo(this.equipmentGridEl);
					break;
				case "inventory":
					slotComp.attachTo(this.inventoryGridEl);
					break;
				case "recycleBin":
					slotComp.attachTo(this.recycleGridEl);
					break;
			}
		});
		this.updateBonusesTable();
	}

	private updateBonusesTable() {
		this.infoGridEl.innerHTML = "";
		const wrapper = document.createElement("div");
		wrapper.classList.add("basic-table-wrapper");
		this.infoGridEl.appendChild(wrapper);

		const table = new TableDisplay({
			container: wrapper,
			columns: 2,
			headers: ["Stat", "Value"],
			banded: true,
			boldFirstColumn: true,
			collapsible: false,
		});

		const bonuses = this.context.character.statsEngine.getLayerModifiers("equipment");

		table.updateData(
			Object.entries(bonuses).map(([stat, value]) => [
				STAT_DISPLAY_NAMES[stat as string] || stat, // Falls back to the original stat name if not found
				value,
			])
		);
	}
}
