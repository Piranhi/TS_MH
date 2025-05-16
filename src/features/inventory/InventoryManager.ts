import { bus } from "@/core/EventBus";
import { isClassCardItem, isEquipmentItem } from "@/shared/type-guards";
import type { EquipmentType, InventoryItemSpec, ItemCategory, EquipmentItemSpec, InventoryItem } from "@/shared/types";
import { ClassCard } from "../classcards/ClassCard";
import { InventoryRegistry } from "./InventoryRegistry";
import { Equipment } from "@/models/Equipment";
import { Saveable } from "@/shared/storage-types";
import { saveManager } from "@/core/SaveManager";
import { printLog } from "@/core/DebugManager";
export type SlotType = "inventory" | "equipment" | "classCard";

interface Slot {
    id: string;
    type: SlotType;
    /** For equipment: "head"|"chest"|"legs" etc.; for cards: 0,1,2…; unused for inventory */
    key?: string | number;
    accepts: ItemCategory[];
    item: InventoryItem | null;
}

export interface InventorySaveState {
    slots: Slot[];
}

export class InventoryManager implements Saveable {
    private maxInventorySlots: number = 20;
    private maxCardSlots: number = 1;
    private unlockedEquipmentSlots: EquipmentType[] = ["chest", "legs", "weapon", "weapon2", "head", "hands", "back", "feet"];
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
        saveManager.register("inventory", this);
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

    public getSlot(id: string): Slot | undefined {
        return this.slotMap.get(id);
    }

    public moveItem(fromId: string, toId: string): boolean {
        // Get Items, check if Valid
        const from = this.getSlot(fromId);
        const to = this.getSlot(toId);
        if (!from?.item || !to) return false;
        if (!to.accepts.includes(from.item.category)) return false;
        // If Equipment Slot - Check EquipType
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

    public addLootById(itemId: string, qty = 1): boolean {
        const item = InventoryRegistry.createItem(itemId, qty);
        printLog(`${qty} item [${item.id}] added to inventory`, 3, "InventoryManager.ts");
        return this.addItemToInventory(item);
    }

    public addItemToInventory(item: InventoryItem): boolean {
        const slot = this.slots.find((s) => s.type === "inventory" && s.item === null);
        if (!slot) return false; // Inventory is full

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

    public getEquippedEquipment(): Equipment[] {
        return this.slots.filter((slot): slot is Slot & { item: Equipment } => slot.type === "equipment" && slot.item !== null && isEquipmentItem(slot.item)).map((slot) => slot.item);
    }

    public getEquippedCards(): ClassCard[] {
        return this.slots.filter((slot): slot is Slot & { item: ClassCard } => slot.type === "classCard" && slot.item !== null && isClassCardItem(slot.item)).map((slot) => slot.item);
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
