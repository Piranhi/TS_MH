import { printLog } from "@/core/DebugManager";
import { AbilitySpec } from "@/models/Ability";
import { Identifiable } from "@/models/SpecRegistryBase";
import { StatsModifier, StatsModifierNumber } from "@/models/Stats";

const rarityChances: [ItemRarity, number][] = [
    ["unique", 1],
    ["legendary", 50],
    ["epic", 150],
    ["rare", 300],
    ["uncommon", 500],
    ["common", 10000],
];

export type ScreenName = "settlement" | "character" | "hunt" | "inventory" | "research" | "train" | "blacksmith";

// ITEMS
export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "unique";
export type ItemCategory = "equipment" | "classCard" | "consumable";
export const ItemCategoryDisplay: Record<ItemCategory, string> = {
    equipment: "Equipment",
    classCard: "Class Card",
    consumable: "Consumable",
};
export type EquipmentType = "head" | "back" | "chest" | "legs" | "feet" | "hands" | "finger1" | "finger2" | "neck" | "weapon" | "weapon2";
export type ItemEquipStatus = "Equipped" | "Unequipped";

export interface InventoryItemSpec extends Identifiable {
    id: string;
    category: ItemCategory;
    name: string;
    description: string;
    iconUrl: string;
    quantity?: number;
    tags?: string[];
}

export interface EquipmentItemSpecRaw extends InventoryItemSpec {
    category: "equipment";
    equipType: EquipmentType;
    statMod: StatsModifierNumber;
}
export interface EquipmentItemSpec extends InventoryItemSpec {
    category: "equipment";
    equipType: EquipmentType;
    statMod: StatsModifier;
}

export interface ClassCardItemSpecRaw extends InventoryItemSpec {
    category: "classCard";
    statMod: StatsModifierNumber; // All numbers
    baseGainRate: number;
    abilities?: string[];
}
export interface ClassCardItemSpec extends InventoryItemSpec {
    category: "classCard";
    statMod: StatsModifier; // All BigNumbers
    baseGainRate: number;
    abilities?: string[];
}

export interface LootSource {
    getItemSpecs(): InventoryItemSpec;
}

// Instance data
export interface InventoryItemState {
    specId: string;
    status: ItemEquipStatus;
    level: number;
    progress: number;
    rarity: ItemRarity;
}

// Just
export interface InventoryItem extends InventoryItemSpec {
    quantity: number;
    rarity?: ItemRarity;
}

export function getItemCategoryLabel(category: ItemCategory): string {
    return ItemCategoryDisplay[category];
}

export function getItemRarity(): ItemRarity {
    const chance = Math.random() * 10000;
    printLog("Rarity Chance: " + chance, 3, "types.ts");
    for (const [rarity, max] of rarityChances) {
        if (chance <= max) return rarity;
    }
    // Fallback if none match (shouldn't happen)
    return "common";
}
