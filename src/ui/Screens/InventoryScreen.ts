import { Player } from "@/models/player";
import { BaseScreen } from "./BaseScreen";
import { addHTMLtoPage } from "../utils/ScreensUtils";
import Markup from "./inventory.html?raw";
import { bus } from "@/core/EventBus";
import { InventorySlot } from "../components/InventorySlot";

export class InventoryScreen extends BaseScreen {
	readonly screenName = "inventory";
	private rootEl!: HTMLElement;
	private inventoryGridEl!: HTMLElement;
	private classCardGridEl!: HTMLElement;
	private equipmentGridEl!: HTMLElement;
	private player: Player = Player.getInstance();

	init() {
		this.element.textContent = "Inventory Screen";
		addHTMLtoPage(Markup, this);

		this.rootEl = document.getElementById("inventory-section")!;
		this.inventoryGridEl = this.rootEl.querySelector(".inventory-grid")!;
		this.classCardGridEl = this.rootEl.querySelector(".classcards-grid")!;
		this.equipmentGridEl = this.rootEl.querySelector(".equipment-grid")!;
		this.renderInventory();

		bus.on("slot:drop", ({ fromId, toId }) => {
			const changed = this.player.inventory.moveItem(fromId, toId);
			if (changed) bus.emit("inventory:changed");
		});
		bus.on("inventory:changed", () => this.renderInventory());
	}
	show() {}
	hide() {}

	private renderInventory() {
		const inventory = this.player.inventory.getSlots();
		this.inventoryGridEl.innerHTML = "";
		this.classCardGridEl.innerHTML = "";
		this.equipmentGridEl.innerHTML = "";

		inventory.forEach((slot) => {
			const slotComp = new InventorySlot(slot.id, slot.type, slot.item);
			switch (slot.type) {
				case "classCard":
					this.classCardGridEl.appendChild(slotComp.el);
					break;
				case "equipment":
					slotComp.el.dataset.slot = String(slot.key);
					this.equipmentGridEl.appendChild(slotComp.el);
					break;
				case "inventory":
					this.inventoryGridEl.appendChild(slotComp.el);
					break;
			}
		});
	}
}
