import { InventoryManager } from "@/features/inventory/InventoryManager";
import { Player } from "@/models/player";
import { BaseScreen } from "./BaseScreen";
import { addHTMLtoPage } from "../utils/ScreensUtils";
import Markup from "./inventory.html?raw";
import { InventoryItem } from "@/shared/types";
import { bus } from "@/core/EventBus";


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
        bus.on("inventory:inventoryChanged", () => this.renderInventory())
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
            el.dataset.slotType = slot.type;
            el.textContent= slot.item ? slot.item.name : ""

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
                    el.dataset.slot = String(slot.key);
					this.equipmentGridEl.appendChild(el);
					break;
				case "inventory":
					this.inventoryGridEl.appendChild(el);
					break;
			}
		});
		this.setupDragAndDrop();
	}

	// -------------------- EVENTS ------------------------------

	private setupDragAndDrop() {
		document.querySelectorAll<HTMLElement>(".slot").forEach((slotEl) => {
			slotEl.addEventListener("dragstart", this.onDragStart);
			slotEl.addEventListener("dragover", this.onDragOver);
			slotEl.addEventListener("dragleave", this.onDragLeave);
			slotEl.addEventListener("drop", this.onDrop);
		});
	}

	// -------------------- DRAG AND DROP ------------------------------

	// When drag starts, stash the source slot ID
	private onDragStart = (e: DragEvent) => {
		const src = e.currentTarget as HTMLElement;

		// Store the slots unique ID in the dataTransfer Payload
		e.dataTransfer!.setData("text/plain", src.dataset.slotId!);
		e.dataTransfer!.effectAllowed = "move";
	};

	// As you hover over a slot, allow the drop and highlight
	private onDragOver = (e: DragEvent) => {
		e.preventDefault(); // Must call to allow drop
		const tgt = e.currentTarget as HTMLElement;
		tgt.classList.add("drag-over");
	};
	// When you leave a slot, clear the highlight
	private onDragLeave = (e: DragEvent) => {
		const tgt = e.currentTarget as HTMLElement;
		tgt.classList.remove("drag-over");
	};

	// On drop, pull the source ID, target ID, swap items, re-render
	private onDrop = (e: DragEvent) => {
		e.preventDefault();
		const tgt = e.currentTarget as HTMLElement;
		tgt.classList.remove("drag-over");

		// Get the origin slot ID from the dragstart
		const fromID = e.dataTransfer!.getData("text/plain");
		// get the target slot ID out of the element
		const toId = tgt.dataset.slotId!;
		// Ask inventory manager to swap them
		const moved = this.player.inventory.moveItem(fromID, toId);

		if (moved) {
			this.renderInventory();
		}
	};

	// -------------------- CLICK ------------------------------

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
