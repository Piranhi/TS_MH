import { Identifiable } from "@/models/SpecRegistryBase";
import { StatsModifier } from "@/models/Stats";

export type ScreenName = "settlement" | "character" | "hunt" | "inventory" | "research" | "train" | "blacksmith";

// ITEMS
export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "unique";
export type ItemCategory = "equipment" | "classCard" | "consumable";
export type EquipmentType = "head" | "back" | "chest" | "legs" | "feet" | "hands" | "finger1" | "finger2" | "neck" | "weapon";
export type ItemEquipStatus = "Equipped" | "Unequipped";

export interface InventoryItemSpec extends Identifiable {
	id: string;
	category: ItemCategory;
	name: string;
	description: string;
	iconUrl: string;
	rarity?: ItemRarity;
	quantity?: number;
}

export interface EquipmentItemSpec extends InventoryItemSpec {
	category: "equipment";
	equipType: EquipmentType;
	statMod: StatsModifier;
}

export interface ClassCardItemSpec extends InventoryItemSpec {
	category: "classCard";
	statMod: StatsModifier;
	baseGainRate: number;
}

// Instance data
export interface InventoryItemState {
	specId: string;
	status: ItemEquipStatus;
	level: number;
	progress: number;
}
