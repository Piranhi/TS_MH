import { InventoryManager } from "@/features/inventory/InventoryManager";
import { Player } from "@/player";
import { BaseScreen } from "./BaseScreen";
import { addHTMLtoPage } from "./ScreensUtils";
import Markup from "./inventory.html?raw";
import { InventoryItem } from "@/shared/types";

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
	}
	show() {}
	hide() {}

	private renderInventory() {
		const inventory = this.player.inventory.getSlots();
		this.inventoryGridEl.innerHTML = "";
		this.classCardGridEl.innerHTML = "";
		this.equipmentGridEl.innerHTML = "";

		// Go through each inventory slot - Switch on Null/Item
		inventory.forEach((slot) => {
			const el = document.createElement("div");
			el.classList.add("slot", `slot--${slot.type}`, slot.item ? `filled` : `empty`);

			el.dataset.slotId = slot.id;
			if (slot.item) {
				el.classList.add(`rarity-${slot.item.rarity}`);
				el.setAttribute("draggable", "true");

				el.innerHTML = `<div class="item-icon"><img src="${slot.item.iconUrl}" alt="${slot.item.name}" /></div><div class="item-count">${slot.item.quantity}</div>`;
			}
			el.addEventListener("click", (e) => this.onInventoryClick(e));
			switch (slot.type) {
				case "classCard":
					this.classCardGridEl.appendChild(el);
					break;
				case "equipment":
					this.equipmentGridEl.appendChild(el);
					break;
				case "inventory":
					this.inventoryGridEl.appendChild(el);
					break;
			}
		});
	}

	private onInventoryClick(e: MouseEvent) {
		const slotEl = e.currentTarget as HTMLElement;
		const idxStr = slotEl.dataset.slotIndex;
		if (idxStr == null) return;

		const index = Number(idxStr);
		const item = Player.getInstance().inventory.getSlots()[index];

		if (item) {
			console.log(`Clicked on slot ${index} with`, item);
		} else {
			console.log("Clicked empty slot", index);
		}
	}
}
