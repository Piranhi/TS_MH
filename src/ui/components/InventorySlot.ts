import { Tooltip } from "./Tooltip";
import { bus } from "@/core/EventBus";
import { InventoryItem } from "@/shared/types";
import { SlotType } from "@/features/inventory/InventoryManager";

/** Pure UI component – no game logic */
export class InventorySlot {
	readonly el: HTMLElement;

	constructor(private readonly slotId: string, private readonly slotType: SlotType, private item: InventoryItem | null) {
		this.el = document.createElement("div");
		this.el.dataset.slotId = slotId;
		this.el.className = `slot slot--${slotType}`;
		this.render();

		/* UI events only */
		this.el.addEventListener("mouseenter", () => this.onHover());
		this.el.addEventListener("mouseleave", () => Tooltip.instance.hide());
		this.el.addEventListener("click", () => bus.emit("slot:click", slotId));

		this.setupDnD();
	}

	update(item: InventoryItem | null) {
		this.item = item;
		this.render();
	}

	/* ─── rendering & hover ──────────────────────────────── */
	private render() {
		this.el.classList.toggle("filled", !!this.item);
		this.el.classList.toggle("empty", !this.item);
		this.el.innerHTML = this.item
			? `<div class="item-icon"><img src="${this.item.iconUrl}"></div>
			   <div class="item-count">${this.item.quantity}</div>`
			: "";

		if (this.item) {
			this.el.classList.add(`rarity-${this.item.rarity}`);
		}
	}

	private onHover() {
		if (!this.item) return;
		Tooltip.instance.show(this.el, {
			icon: this.item.iconUrl,
			name: this.item.name,
			rarity: this.item.rarity,
			type: this.item.category,
			description: this.item.description,
		});
	}

	/* ─── drag & drop – emit, don’t decide ──────────────── */
	private setupDnD() {
		this.el.setAttribute("draggable", "true");

		this.el.addEventListener("dragstart", (e) => {
			Tooltip.instance.hide();
			e.dataTransfer!.setData("text/plain", this.slotId);
			bus.emit("slot:drag-start", { slotId: this.slotId });
		});

		this.el.addEventListener("dragover", (e) => {
			e.preventDefault();
			this.el.classList.add("drag-over");
		});

		this.el.addEventListener("dragleave", () => this.el.classList.remove("drag-over"));

		this.el.addEventListener("drop", (e) => {
			e.preventDefault();
			this.el.classList.remove("drag-over");
			const fromId = e.dataTransfer!.getData("text/plain");
			const toId = this.slotId;
			bus.emit("slot:drop", { fromId, toId });
		});
	}
}
