import { BaseScreen } from "./BaseScreen";
import Markup from "./inventory.html?raw";
import { bus } from "@/core/EventBus";
import { InventorySlot } from "../components/InventorySlot";
import { bindEvent } from "@/shared/utils/busUtils";

export class InventoryScreen extends BaseScreen {
	readonly screenName = "inventory";
	private inventoryGridEl!: HTMLElement;
	private classCardGridEl!: HTMLElement;
	private equipmentGridEl!: HTMLElement;

	init() {
		this.addMarkuptoPage(Markup);
		this.inventoryGridEl = this.$(".inventory-grid");
		this.classCardGridEl = this.$(".classcards-grid");
		this.equipmentGridEl = this.$(".equipment-grid");
		this.bindEvents();
		this.renderInventory();
	}
	show() {}
	hide() {}

	private bindEvents() {
		bindEvent(this.eventBindings, "slot:drop", ({ fromId, toId }) => {
			const changed = this.context.inventory.moveItem(fromId, toId);
			if (changed) bus.emit("inventory:changed");
		});
		bindEvent(this.eventBindings, "inventory:changed", () => this.renderInventory());
	}

	private renderInventory() {
		const inventory = this.context.inventory.getSlots();
		this.inventoryGridEl.innerHTML = "";
		this.classCardGridEl.innerHTML = "";
		this.equipmentGridEl.innerHTML = "";

		inventory.forEach((slot) => {
			const slotComp = new InventorySlot(slot.id, slot.type, slot.itemState);
			switch (slot.type) {
				case "classCard":
					slotComp.attachTo(this.classCardGridEl);
					break;
				case "equipment":
					slotComp.setSlotKey(String(slot.key));
					slotComp.attachTo(this.equipmentGridEl);
					break;
				case "inventory":
					slotComp.attachTo(this.inventoryGridEl);
					break;
			}
		});
	}
}
