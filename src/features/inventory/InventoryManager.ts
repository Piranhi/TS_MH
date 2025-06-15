import { bus } from "@/core/EventBus";
import { isClassCardItemSpec, isEquipmentItemSpec } from "@/shared/type-guards";
import type { EquipmentType, InventoryItemState, ItemCategory } from "@/shared/types";
import { ClassCard } from "../classcards/ClassCard";
import { InventoryRegistry } from "./InventoryRegistry";
import { Equipment } from "@/models/Equipment";
import { Saveable } from "@/shared/storage-types";
import { printLog } from "@/core/DebugManager";
import { Resource } from "./Resource";
export type SlotType = "inventory" | "equipment" | "classCard" | "resource";

interface Slot {
	id: string;
	type: SlotType;
	/** For equipment: "head"|"chest"|"legs" etc.; for cards: 0,1,2…; unused for inventory */
	key?: string | number;
	accepts: ItemCategory[];
	itemState: InventoryItemState | null;
}

export interface InventorySaveState {
	slots: Slot[];
}

export class InventoryManager implements Saveable {
	private maxInventorySlots: number = 20;
	private maxCardSlots: number = 1;
	private unlockedEquipmentSlots: EquipmentType[] = [
		"chest",
		"legs",
		"weapon",
		"weapon2",
		"head",
		"hands",
		"back",
		"feet",
		"finger1",
		"finger2",
		"neck",
	];
	private slots: Slot[];
	private slotMap = new Map<string, Slot>();

	private ACCEPT_MAP: Record<SlotType, ItemCategory[]> = {
		inventory: ["equipment", "classCard", "consumable"],
		equipment: ["equipment"],
		classCard: ["classCard"],
		resource: ["resource"],
	};

	constructor() {
		// Create and populate initial slots
		this.slots = [
			...Array(this.maxInventorySlots)
				.fill(0)
				.map((_, i) => this.makeSlot("inventory", i)),
			...this.unlockedEquipmentSlots.map((name) => this.makeSlot("equipment", name)),
			...Array(this.maxCardSlots)
				.fill(0)
				.map((_, i) => this.makeSlot("classCard", i)),
			...Array(2) // or however many you want
				.fill(0)
				.map((_, i) => this.makeSlot("resource", i)),
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
			itemState: null,
		};
	}

	//------------------------ INVENTORY ------------------------------

	private fillWithEmptySlots() {
		this.slots = [
			...Array(this.maxInventorySlots)
				.fill(0)
				.map((_, i) => this.makeSlot("inventory", i)),
			...this.unlockedEquipmentSlots.map((name) => this.makeSlot("equipment", name)),
			...Array(this.maxCardSlots)
				.fill(0)
				.map((_, i) => this.makeSlot("classCard", i)),
			...Array(2) // or however many you want
				.fill(0)
				.map((_, i) => this.makeSlot("resource", i)),
		];
	}

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

	public getSlot(id: string): Slot | undefined {
		return this.slotMap.get(id);
	}

	public moveItem(fromId: string, toId: string): boolean {
		// Get Items, check if Valid
		const from = this.getSlot(fromId);
		const to = this.getSlot(toId);
		if (!from?.itemState || !to) return false;
		const spec = InventoryRegistry.getItemById(from.itemState.specId);
		if (!to.accepts.includes(spec.category)) return false;

		// If Equipment Slot - Check EquipType
		if (to.type === "equipment") {
			if (!isEquipmentItemSpec(spec)) return false;
			if (spec.equipType !== to.key) return false;
		}
		// Merge if dropping onto duplicate upgradable item
		if (to.itemState) {
			const toSpec = InventoryRegistry.getItemById(to.itemState.specId);
			if (
				spec.id === toSpec.id &&
				from.itemState.rarity === to.itemState.rarity &&
				(spec.category === "equipment" || spec.category === "classCard")
			) {
				if (spec.category === "equipment") {
					const target = Equipment.createFromState(to.itemState);
					target.addLevels(from.itemState.level ?? 0);
				} else if (spec.category === "classCard") {
					const target = ClassCard.createFromState(to.itemState);
					target.addLevels(from.itemState.level ?? 0);
				}
				from.itemState = null;
				this.emitChange();
				if (from.type === "equipment" || to.type === "equipment") {
					bus.emit("player:equipmentChanged", this.getEquippedEquipment());
				}
				if (from.type === "classCard" || to.type === "classCard") {
					bus.emit("player:classCardsChanged", this.getEquippedCards());
				}
				return true;
			}
		}
		// Swap items between slots
		[from.itemState, to.itemState] = [to.itemState, from.itemState];
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

	/**
	 * Automatically move an item from an inventory slot to the
	 * appropriate equipment or class card slot.
	 */
	public autoEquip(fromId: string): boolean {
		const from = this.getSlot(fromId);
		if (!from || from.type !== "inventory" || !from.itemState) return false;

		const spec = InventoryRegistry.getItemById(from.itemState.specId);
		if (isEquipmentItemSpec(spec)) {
			const target = this.getSlot(`equipment-${spec.equipType}`);
			if (!target) return false;
			return this.moveItem(fromId, target.id);
		}
		if (spec.category === "classCard") {
			const cardSlot = this.getSlotsByType("classCard")[0];
			if (!cardSlot) return false;
			return this.moveItem(fromId, cardSlot.id);
		}
		return false;
	}

	public expandInventorySize(by: number, type: SlotType) {
		const start = this.slots.filter((s) => s.type === type).length;
		for (let i = 0; i < by; i++) {
			this.slots.push(this.makeSlot(type, start + i));
		}
		this.updateSlotMap();
		this.emitChange();
	}

	public addLootById(itemId: string, qty = 1): boolean {
		const state = InventoryRegistry.createItemState(itemId, qty);
		return this.addItemToInventory(state);
	}

	public addItemToInventory(itemState: InventoryItemState): boolean {
		const slot = this.slots.find((s) => s.type === "inventory" && s.itemState === null);
		if (!slot) return false; // Inventory is full
		printLog(`${itemState.quantity} item [${itemState.specId}] added to inventory`, 3, "InventoryManager.ts");
		slot.itemState = itemState;
		this.emitChange();
		return true;
	}

	private findResourceSlot(resourceId: string): Slot | undefined {
		return this.slots.find((slot) => slot.type === "inventory" && slot.itemState?.specId === resourceId);
	}

	public removeItemFromInventory(itemState: InventoryItemState): boolean {
		const slot = this.slots.find((s) => s.itemState === itemState);
		if (!slot) {
			return false; //Item not found
		}
		slot.itemState = null;
		this.emitChange();
		return true;
	}

	public getInventoryBySlotType(slotType: SlotType) {
		return this.slots.filter((slot) => slot !== null && slot.type === slotType);
	}

	public clearSlots() {
		this.fillWithEmptySlots();
		this.updateSlotMap();
		this.emitChange();
	}

	//------------------------ EQUIPMENT ------------------------------

	public getEquippedEquipment(): Equipment[] {
		return (
			this.slots
				// 1) Pick only the equipment‐slots that actually have something in them
				.filter((slot) => slot.type === "equipment" && slot.itemState !== null)
				// 2) For each one, grab its saved state, look up the latest spec, and construct an Equipment
				.map((slot) => {
					const state = slot.itemState!; // { id, quantity, rarity }
					return Equipment.createFromState(state);
				})
		);
	}

	public getEquippedCards(): ClassCard[] {
		return this.slots
			.filter((slot) => slot.type === "classCard" && slot.itemState !== null)
			.map((slot) => {
				const state = slot.itemState!;
				return ClassCard.createFromState(state);
			});
	}

	private emitChange() {
		bus.emit("inventory:changed");
	}

	//-----------------------------------SAVE/LOAD ----------------------------------------

	save(): InventorySaveState {
		return { slots: this.slots };
	}

	load(state: InventorySaveState): void {
		this.slots = state?.slots;
		this.updateSlotMap();
		this.emitChange();
	}
}
