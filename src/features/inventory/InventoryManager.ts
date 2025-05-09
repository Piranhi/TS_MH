import { bus } from "@/EventBus";
import { Player } from "@/player";
import type { equipmentSlot, InventoryItem, ItemCategory } from "@/shared/types";
//export type slotType = "inventory" | "equipment" | "classCard";

interface Slot {
	/** Unique ID—e.g. "inv-0", "equip-chest", "card-2" */
	id: string;

	type: "inventory" | "equipment" | "classCard";
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
	private unlockedEquipmentSlots: equipmentSlot[] = ["chest", "legs", "weapon"];

	private slots: Slot[];
	/* 	private cardSlots: (InventoryItem | null)[]
	private equippedSlots: (InventoryItem | null)[] */

	constructor() {
		this.slots = [
			// inventory slots
			...Array(this.maxInventorySlots)
				.fill(null)
				.map((_, i) => ({
					id: `inv-${i}`,
					type: "inventory" as const,
					key: i,
					accepts: ["equipment", "classCard", "consumable"] as ItemCategory[],
					item: null,
				})),
			// equipment slots
			...this.unlockedEquipmentSlots.map((slotName) => ({
				id: `equip-${slotName}`,
				type: "equipment" as const,
				key: slotName,
				accepts: ["equipment"] as ItemCategory[],
				item: null,
			})),
			// card slots
			...Array(this.maxCardSlots)
				.fill(null)
				.map((_, i) => ({
					id: `card-${i}`,
					type: "classCard" as const,
					key: i,
					accepts: ["classCard"] as ItemCategory[],
					item: null,
				})),
		];
	}

	//------------------------ INVENTORY ------------------------------

	public getSlots() {
		return this.slots;
	}

	getInventory() {
		return this.slots.filter((s) => s.type === "inventory");
	}
	getEquipped() {
		return this.slots.filter((s) => s.type === "equipment");
	}
	getCards() {
		return this.slots.filter((s) => s.type === "classCard");
	}

	public moveItem(fromId: string, toId: string): boolean {
		// Remove from old slot
		const from = this.slots.find((s) => s.id === fromId);
		const to = this.slots.find((s) => s.id === toId);

		if (!from || !to) return false;
		if (!from.item) return false;

		// Validation
		if (!to.accepts.includes(from.item.category)) return false;

		// Swap
		[from.item, to.item] = [to.item, from.item];
		bus.emit("inventory:inventoryChanged");
		return true;
	}

	public expandInventorySize(by: number) {
		this.slots.push(...Array(by).fill(null));
	}

	public addItemToInventory(item: InventoryItem): boolean {
		const slot = this.slots.find(s => s.type === "inventory" && s.item === null);
		if (!slot) {
			// Inventory is full
			return false;
		}
		slot.item = item;
		bus.emit("inventory:inventoryChanged");
		return true;
	}

	public removeItemFromInventory(item: InventoryItem): boolean {
		const slot = this.slots.find(s => s.item === item);
		if (!slot) {
			return false; //Item not found
		}
		slot.item = null
		bus.emit("inventory:inventoryChanged");
		return true;
	}

	public removeInventoryAt(index: number): void {
		if (index >= 0 && index < this.slots.length) {
			this.slots[index] = null;
			bus.emit("inventory:inventoryChanged");
		}
	}

	public getInventoryByCatergory(cat: ItemCategory) {
		return this.slots.filter((i) => i !== null && i.category === cat);
	}

	//------------------------ EQUIPMENT ------------------------------

	public getEquippedEquipment(): (InventoryItem | null)[] {
		return this.equippedSlots;
	}

	public equipEquipment(item: InventoryItem, slot: equipmentSlot): boolean {
		return true;
	}

	//------------------------ CARDS ------------------------------
	public getEquippedCards(): (InventoryItem | null)[] {
		return this.cardSlots;
	}

	public equipCard(item: InventoryItem) {}

	public unEquipCard() {}
}
