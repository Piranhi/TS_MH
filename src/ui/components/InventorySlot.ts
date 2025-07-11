import { Tooltip } from "./Tooltip";
import { bus } from "@/core/EventBus";
import { getItemCategoryLabel, InventoryItemSpec, InventoryItemState } from "@/shared/types";
import { SlotType } from "@/features/inventory/InventoryManager";
import { formatNumberShort, prettify } from "@/shared/utils/stringUtils";
import { UIBase } from "./UIBase";
import { InventoryRegistry } from "@/features/inventory/InventoryRegistry";
import { isEquipmentItemSpec } from "@/shared/type-guards";
import { StatsModifier } from "@/models/Stats";
import { scaleStatsModifier } from "@/shared/utils/stat-utils";
import { Equipment } from "@/models/Equipment";

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
		this.bindDomEvent("click", (e) => this.handleClick(e as MouseEvent));
		this.bindDomEvent("dblclick", (e) => this.handleDoubleClick());
	}

	private handleMouseEnter() {
		if (!this.itemState || !this.spec) return;

		// Common tooltip data
		const baseTooltip = {
			icon: this.spec.iconUrl,
			name: `Lvl:${this.itemState.level} - ${prettify(this.spec.name)}`,
			rarity: prettify(this.itemState.rarity!),
			type: getItemCategoryLabel(this.spec.category),
			tintColour: this.itemState.rarity,
			heirloom: this.itemState.heirloom,
		};

		// TODO: This is a hack to get the stat modifiers for equipment
		// TODO: We should have a better way to do this
		if (isEquipmentItemSpec(this.spec)) {
			const equipment = Equipment.createFromState(this.itemState);
			const statModifiers = this.formatStatModifiers(equipment.getBonuses());

			Tooltip.instance.show(this.element, {
				...baseTooltip,
				stats: statModifiers,
			});
		} else {
			Tooltip.instance.show(this.element, {
				...baseTooltip,
			});
		}
	}

	// Helper method to format stat modifiers from Partial<Stats> object
	private formatStatModifiers(statMod: StatsModifier): string[] {
		if (!statMod) return [];

		const modifiers: string[] = [];

		// Iterate through each property in the statMod object
		for (const [statKey, value] of Object.entries(statMod)) {
			if (value !== undefined && value !== 0) {
				const sign = value >= 0 ? "+" : "";
				const statName = prettify(statKey); // Convert "attackPower" to "Attack Power" etc.
				modifiers.push(`${sign}${formatNumberShort(value)} ${statName}`);
			}
		}

		return modifiers;
	}

	private handleMouseLeave() {
		Tooltip.instance.hide();
	}
	private handleClick(e: MouseEvent) {
		if (e.ctrlKey) {
			bus.emit("slot:ctrlclick", this.slotId);
		} else {
			bus.emit("slot:click", this.slotId);
		}
	}
	private handleDoubleClick() {
		bus.emit("slot:dblclick", this.slotId);
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
