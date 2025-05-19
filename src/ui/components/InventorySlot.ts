import { Tooltip } from "./Tooltip";
import { bus } from "@/core/EventBus";
import { getItemCategoryLabel, InventoryItem } from "@/shared/types";
import { SlotType } from "@/features/inventory/InventoryManager";
import { prettify } from "@/shared/utils/stringUtils";
import { UIBase } from "./UIBase";

/** Pure UI component – no game logic */
export class InventorySlot extends UIBase {
	constructor(private readonly slotId: string, private readonly slotType: SlotType, private item: InventoryItem | null) {
		super();
		this.element = document.createElement("div");
		this.element.dataset.slotId = slotId;
		this.element.className = `slot slot--${slotType}`;
		this.render();
		this.bindEvents();
		this.setupDnD();
	}

	private bindEvents() {
		this.bindDomEvent("mouseenter", (e) => this.handleMouseEnter());
		this.bindDomEvent("mouseleave", (e) => this.handleMouseLeave());
		this.bindDomEvent("click", (e) => this.handleClick());
	}

	private handleMouseEnter() {
		if (!this.item) return;
		Tooltip.instance.show(this.element, {
			icon: this.item.iconUrl,
			name: prettify(this.item.name),
			rarity: prettify(this.item.rarity!),
			type: getItemCategoryLabel(this.item.category),
			description: this.item.description,
			tintColour: this.item.rarity,
		});
	}

	private handleMouseLeave() {
		Tooltip.instance.hide();
	}
	private handleClick() {
		bus.emit("slot:click", this.slotId);
	}

	update(item: InventoryItem | null) {
		this.item = item;
		this.render();
	}

	public setSlotKey(key: string) {
		this.element.dataset.slot = key;
	}

	/* ─── rendering & hover ──────────────────────────────── */
	private render() {
		this.element.classList.toggle("filled", !!this.item);
		this.element.classList.toggle("empty", !this.item);
		this.element.innerHTML = this.item
			? `<div class="item-icon"><img src="${this.item.iconUrl}"></div>
			   <div class="item-count">${this.item.quantity}</div>`
			: "";

		if (this.item) {
			this.element.classList.add(`rarity-${this.item.rarity}`);
		}
	}

	/* ─── drag & drop ──────────────── */
	private setupDnD() {
		this.element.setAttribute("draggable", "true");
		this.bindDomEvent("dragstart", (e) => this.handleDragStart(e as DragEvent));
		this.bindDomEvent("dragover", (e) => this.handleDragOver(e as DragEvent));
		this.bindDomEvent("dragleave", (e) => this.handleDragLeave(e as DragEvent));
		this.bindDomEvent("drop", (e) => this.handleDrop(e as DragEvent));
	}

	private handleDragStart(e: DragEvent) {
		Tooltip.instance.hide();
		e.dataTransfer!.setData("text/plain", this.slotId);
		bus.emit("slot:drag-start", { slotId: this.slotId });
	}
	private handleDragOver(e: DragEvent) {
		e.preventDefault();
		this.element.classList.add("drag-over");
	}
	private handleDragLeave(e: DragEvent) {
		this.element.classList.remove("drag-over");
	}
	private handleDrop(e: DragEvent) {
		e.preventDefault();
		this.element.classList.remove("drag-over");
		const fromId = e.dataTransfer!.getData("text/plain");
		const toId = this.slotId;
		bus.emit("slot:drop", { fromId, toId });
	}
}
