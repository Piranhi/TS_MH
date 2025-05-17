import { printLog } from "@/core/DebugManager";
import { Identifiable } from "@/models/SpecRegistryBase";
import { StatsModifier, StatsModifierNumber } from "@/models/Stats";
import { BigNumber } from "@/models/utils/BigNumber";

export const AREATIER_MULTIPLIERS = [1, 1.2, 1.5, 2, 2.5, 3];
export const ITEM_RARITIES = ["common", "uncommon", "rare", "epic", "legendary", "unique"] as const;

export const RARITY_MULTIPLIERS: Record<ItemRarity, number> = {
	common: 1.0,
	uncommon: 1.1,
	rare: 1.25,
	epic: 1.5,
	legendary: 1.6,
	unique: 2,
};
const rarityChances: [ItemRarity, number][] = [
	["unique", 1],
	["legendary", 50],
	["epic", 150],
	["rare", 300],
	["uncommon", 500],
	["common", 10000],
];

export const RARITY_DISPLAY_NAMES: Record<ItemRarity, string> = {
	common: "Common",
	uncommon: "Uncommon",
	rare: "Rare",
	epic: "Epic",
	legendary: "Legendary",
	unique: "Unique",
};

// ITEMS
export type ItemRarity = (typeof ITEM_RARITIES)[number];
export type ItemCategory = "equipment" | "classCard" | "consumable";
export const ItemCategoryDisplay: Record<ItemCategory, string> = {
	equipment: "Equipment",
	classCard: "Class Card",
	consumable: "Consumable",
};
export type EquipmentType = "head" | "back" | "chest" | "legs" | "feet" | "hands" | "finger1" | "finger2" | "neck" | "weapon" | "weapon2";
export type ItemEquipStatus = "Equipped" | "Unequipped";
export type BuildingType = "library" | "blacksmith" | "market";
export interface BuildingSpec {
	id: BuildingType;
	displayName: string;
	description: string;
	icon: string;
	baseCost: number;
}
export interface BuildingState {
	level: number;
	progress: BigNumber;
}
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
	printLog("Creating Item - Rarity Chance: " + chance, 4, "types.ts");
	for (const [rarity, max] of rarityChances) {
		if (chance <= max) return rarity;
	}
	// Fallback if none match (shouldn't happen)
	return "common";
}
