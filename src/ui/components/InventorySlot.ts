import { Tooltip } from "./Tooltip";
import { bus } from "@/core/EventBus";
import { getItemCategoryLabel, InventoryItemSpec, InventoryItemState } from "@/shared/types";
import { SlotType } from "@/features/inventory/InventoryManager";
import { prettify } from "@/shared/utils/stringUtils";
import { UIBase } from "./UIBase";
import { InventoryRegistry } from "@/features/inventory/InventoryRegistry";

/** Pure UI component – no game logic */
export class InventorySlot extends UIBase {
	private spec: InventoryItemSpec | null = null;
	constructor(private readonly slotId: string, private readonly slotType: SlotType, private itemState: InventoryItemState | null) {
		super();
		this.element = document.createElement("div");
		this.element.dataset.slotId = slotId;
		this.element.className = `slot slot--${slotType}`;
		if (itemState) {
			this.spec = InventoryRegistry.getItemById(itemState!.specId);
		}

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
		if (!this.itemState || !this.spec) return;
		Tooltip.instance.show(this.element, {
			icon: this.spec.iconUrl,
			name: `Lvl:${this.itemState.level} - ${prettify(this.spec.name)}`,
			rarity: prettify(this.itemState.rarity!),
			type: getItemCategoryLabel(this.spec.category),
			description: this.spec.description,
			tintColour: this.itemState.rarity,
		});
	}

	private handleMouseLeave() {
		Tooltip.instance.hide();
	}
	private handleClick() {
		bus.emit("slot:click", this.slotId);
	}

	update(itemState: InventoryItemState | null) {
		this.itemState = itemState;
		this.render();
	}

	public setSlotKey(key: string) {
		this.element.dataset.slot = key;
	}

	/* ─── rendering & hover ──────────────────────────────── */
	private render() {
		this.element.classList.toggle("filled", !!this.itemState);
		this.element.classList.toggle("empty", !this.itemState);
		this.element.innerHTML = this.itemState
			? `<div class="item-icon"><img src="${this.spec ? this.spec.iconUrl : ""}"></div>
			   <div class="item-count">${this.itemState.quantity}</div>`
			: "";

		if (this.itemState) {
			this.element.classList.add(`rarity-${this.itemState.rarity}`);
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
