import { StatsModifier } from "@/models/Stats";

export type ScreenName = "settlement" | "character" | "hunt" | "inventory" | "research" | "train" | "blacksmith";

// ITEMS
export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "unique";
export type ItemCategory = "equipment" | "classCard" | "consumable";
export type EquipmentType = "head" | "back" | "chest" | "legs" | "feet" | "hands" | "finger1" | "finger2" | "neck" | "weapon";
export type ItemEquipStatus = "Equipped" | "Unequipped"; // Used for inventory items

export interface InventoryItem {
    id: string;
    category: ItemCategory;
    name: string;
    description: string;
    iconUrl: string;
    rarity?: ItemRarity;
    quantity?: number;
}

export interface EquipmentItem extends InventoryItem {
    id: string;
    category: "equipment";
    name: string;
    iconUrl: string;
    rarity?: ItemRarity;
    equipType: EquipmentType;
    statMod: StatsModifier;
}

export interface ClassCardItem extends InventoryItem {
    id: string;
    category: "classCard";
    name: string;
    iconUrl: string;
    rarity?: ItemRarity;
}
