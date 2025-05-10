import { bus } from "@/core/EventBus";
import { isClassCardItem, isEquipmentItem } from "@/shared/type-guards";
import type { equipmentType, InventoryItem, ItemCategory, EquipmentItem } from "@/shared/types";
import { ClassCard } from "../classcards/ClassCard";
export type SlotType = "inventory" | "equipment" | "classCard";

interface Slot {
	/** Unique ID—e.g. "inv-0", "equip-chest", "card-2" */
	id: string;

	type: SlotType; //"inventory" | "equipment" | "classCard";
	/** For equipment: "head"|"chest"|"legs" etc.; for cards: 0,1,2…; unused for inventory */
	key?: string | number;

	/** What category of items this slot accepts */
	accepts: ItemCategory[];
	/** The item (or null if empty) */
	item: InventoryItem | null;
}

export class InventoryManager {
	private maxInventorySlots: number = 20;
	private maxCardSlots: number = 1;
	private unlockedEquipmentSlots: equipmentType[] = ["chest", "legs", "weapon"];
	private slots: Slot[];
	private slotMap = new Map<string, Slot>();

	private ACCEPT_MAP: Record<SlotType, ItemCategory[]> = {
		inventory: ["equipment", "classCard", "consumable"],
		equipment: ["equipment"],
		classCard: ["classCard"],
	};

	constructor() {
		this.slots = [
			...Array(this.maxInventorySlots)
				.fill(0)
				.map((_, i) => this.makeSlot("inventory", i)),
			...this.unlockedEquipmentSlots.map((name) => this.makeSlot("equipment", name)),
			...Array(this.maxCardSlots)
				.fill(0)
				.map((_, i) => this.makeSlot("classCard", i)),
		];
		this.updateSlotMap();
	}

	//------------------------ FACTORIES ------------------------------
	private makeSlot(type: SlotType, key: string | number): Slot {
		return {
			id: `${type}-${key}`,
			type,
			key,
			accepts: this.ACCEPT_MAP[type],
			item: null,
		};
	}

	//------------------------ INVENTORY ------------------------------

	private updateSlotMap() {
		this.slotMap.clear();
		this.slots.forEach((s) => this.slotMap.set(s.id, s));
	}
	public getSlots() {
		return this.slots;
	}

	public getSlotsByType(type: SlotType) {
		return this.slots.filter((s) => s.type === type);
	}

	private getSlot(id: string): Slot | undefined {
		return this.slotMap.get(id);
	}

	public moveItem(fromId: string, toId: string): boolean {
		// Get Items, check if Valid
		const from = this.getSlot(fromId);
		const to = this.getSlot(toId);
		if (!from?.item || !to) return false;
		if (!to.accepts.includes(from.item.category)) return false;
		if (to.type === "equipment") {
			if (!isEquipmentItem(from.item)) return false;
			if (from.item.equipType !== to.key) return false;
		}
		// Swap
		[from.item, to.item] = [to.item, from.item];
		this.emitChange();

		// Emit smaller bus changes.
		if (from.type === "equipment" || to.type === "equipment") {
			bus.emit("player:equipmentChanged", this.getEquippedEquipment());
		}
		if (from.type === "classCard" || to.type === "classCard") {
			bus.emit("player:classCardsChanged", this.getEquippedCards());
		}

		return true;
	}

	public expandInventorySize(by: number) {
		const start = this.slots.filter((s) => s.type === "inventory").length;
		for (let i = 0; i < by; i++) {
			this.slots.push(this.makeSlot("inventory", start + i));
		}
		this.updateSlotMap();
		this.emitChange();
	}

	public addItemToInventory(item: InventoryItem): boolean {
		const slot = this.slots.find((s) => s.type === "inventory" && s.item === null);
		if (!slot) {
			// Inventory is full
			return false;
		}
		slot.item = item;
		this.emitChange();
		return true;
	}

	public removeItemFromInventory(item: InventoryItem): boolean {
		const slot = this.slots.find((s) => s.item === item);
		if (!slot) {
			return false; //Item not found
		}
		slot.item = null;
		this.emitChange();
		return true;
	}

	public getInventoryBySlotType(slotType: SlotType) {
		return this.slots.filter((slot) => slot !== null && slot.type === slotType);
	}

	//------------------------ EQUIPMENT ------------------------------

	public getEquippedEquipment(): EquipmentItem[] {
		return this.slots
			.filter((slot) => slot.type === "equipment" && slot.item !== null)
			.map((s) => s.item!)
			.filter(isEquipmentItem);
	}

	public getEquippedCards(): ClassCard[] {
		return this.slots
			.filter((s) => s.type === "classCard" && s.item !== null)
			.map((s) => s.item!)
			.filter(isClassCardItem);
	}

	private emitChange() {
		bus.emit("inventory:inventoryChanged");
	}
}
