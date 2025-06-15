import { printLog } from "@/core/DebugManager";
import { Identifiable } from "@/models/SpecRegistryBase";
import { Stats, StatsModifier } from "@/models/Stats";
import { MilestoneTag } from "./Milestones";
import { GameEvents } from "@/core/EventBus";
import { BaseCharacter } from "@/models/BaseCharacter";
import { BigNumber } from "@/models/utils/BigNumber";

// --------------------- SETTLEMENT + BUILDINGS ----------------------------
export const STARTING_BUILDING_UNLOCKS = ["guildHall"];

export type BuildingType = "guild_hall" | "mine" | "library" | "blacksmith" | "market";
export type BuildingUnlockStatus = "unlocked" | "construction" | "hidden";

export type ProgressionTrigger = {
	event: keyof GameEvents;
	id: string;
	unlocks: MilestoneTag[];
};

export interface BuildingSpec {
	id: BuildingType;
	displayName: string;
	description: string;
	icon: string;
	baseCost: number;
}

export interface BuildingState {
	unlockStatus: BuildingUnlockStatus;
	pointsAllocated: number;
	nextUnlock: number;
	level: number;
}

export interface BuildingSnapshot {
	displayName: string;
	level: number;
	pointsAllocated: number;
	nextUnlock: number;
}

export interface ResearchSpec {
	id: string;
	name: string;
	description: string;
	icon: string;
	baseTime: number; // seconds required at base speed
}

export interface ResearchState {
	progress: number;
	unlocked: boolean;
}

// ------------------- AREA + COMBAT ------------------------------

export const ENEMY_ARCHETYPES = {
	tank: {
		hp: 6,
		attack: 2,
		defence: 4,
		speed: 1,
		defaultAbilities: ["basic_melee", "defensive_stance"],
	},
	bruiser: {
		hp: 4,
		attack: 4,
		defence: 2,
		speed: 2,
		defaultAbilities: ["basic_melee", "power_strike"],
	},
	glass_cannon: {
		hp: 2,
		attack: 6,
		defence: 1,
		speed: 2,
		defaultAbilities: ["basic_melee", "critical_strike"],
	},
	dodger: {
		hp: 3,
		attack: 3,
		defence: 1,
		speed: 4,
		defaultAbilities: ["basic_melee", "quick_strike"],
	},
	balanced: {
		hp: 4,
		attack: 3,
		defence: 2,
		speed: 2,
		defaultAbilities: ["basic_melee"],
	},
	rare_elite: {
		hp: 5,
		attack: 5,
		defence: 3,
		speed: 3,
		defaultAbilities: ["basic_melee", "elite_combo"],
	},
	boss: {
		hp: 40,
		attack: 20,
		defence: 15,
		speed: 3,
		defaultAbilities: ["basic_melee", "boss_slam", "area_attack"],
	},
} as const;

// Create a union type from the archetype keys
export type EnemyArchetype = keyof typeof ENEMY_ARCHETYPES;
export type EffectType = "physical" | "magical" | "heal" | "buff" | "debuff";

export interface EffectSpec {
	type: EffectType;
	target: "self" | "enemy";
	value: number;
	scale?: number;
	durationSeconds?: number;
	statKey?: keyof Stats;
}

// A “packet” describing exactly what one ability use will do
export interface EffectInstance {
	source: BaseCharacter;
	target: "self" | "enemy";
	type: EffectType;
	/** raw amount (damage before mitigation, heal % of maxHp, buff %, etc.) */
	rawValue: BigNumber;
	durationSeconds?: number;
	statKey?: keyof Stats;
}

// A small struct for result data (optional)
export interface EffectResult {
	source: BaseCharacter;
	target: BaseCharacter;
	effect: EffectInstance;
	/** e.g. finalDamage after mitigation, or actualHealAmount */
	outcomeValue: BigNumber;
}

// -------------------- ITEMS ------------------------------
export const ITEM_RARITIES = ["common", "uncommon", "rare", "epic", "legendary", "unique"] as const;

export const RARITY_DISPLAY_NAMES: Record<ItemRarity, string> = {
	common: "Common",
	uncommon: "Uncommon",
	rare: "Rare",
	epic: "Epic",
	legendary: "Legendary",
	unique: "Unique",
};

// -------------------- RESOURCES ------------------------------

export interface ResourceData {
	quantity: number;
	level: number;
	xp: number;
	isUnlocked: boolean;
}

export interface ResourceSpec {
	id: string;
	name: string;
	description: string;
	iconUrl: string;
	requires: ResourceRequirement[];
	craftTime: number; // seconds
}

export interface ResourceRequirement {
	resource: string;
	quantity: number;
}
[];

// -------------------- TRAITS ------------------------------
export const TRAIT_RARITIES = ["common", "uncommon", "rare", "epic"] as const;
export type TraitRarity = (typeof TRAIT_RARITIES)[number];

export interface TraitSpec extends Identifiable {
	id: string;
	name: string;
	description: string;
	rarity: TraitRarity;
}

export type ItemRarity = (typeof ITEM_RARITIES)[number];
export type ItemCategory = "equipment" | "classCard" | "consumable" | "resource";
export const ItemCategoryDisplay: Record<ItemCategory, string> = {
	equipment: "Equipment",
	classCard: "Class Card",
	consumable: "Consumable",
	resource: "Resource",
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

export interface EquipmentItemSpec extends InventoryItemSpec {
	category: "equipment";
	equipType: EquipmentType;
	statMod: StatsModifier;
}

export interface ClassCardItemSpec extends InventoryItemSpec {
	category: "classCard";
	statMod: StatsModifier;
	baseGainRate: number;
	abilities?: string[];
}

export interface ResourceItemSpec extends InventoryItemSpec {
	category: "resource";
	requires: [{ string: Identifiable; quantity: number }];
	craftTime: number;
}

export interface LootSource {
	getItemSpecs(): InventoryItemSpec;
}

// Instance data
export interface InventoryItemState {
	specId: string;
	quantity: number;
	// Only for equippables
	status?: ItemEquipStatus;
	level?: number;
	progress?: number;
	rarity?: ItemRarity;
}

export function getItemCategoryLabel(category: ItemCategory): string {
	return ItemCategoryDisplay[category];
}

export interface UpgradableItem {
	readonly level: number;
	readonly rarity: ItemRarity | undefined;
	addLevels(amount: number): void;
}

export function getNextRarity(rarity: ItemRarity): ItemRarity {
	const idx = ITEM_RARITIES.indexOf(rarity);
	return ITEM_RARITIES[Math.min(idx + 1, ITEM_RARITIES.length - 1)];
}

// -------------------------- OUTPOSTS ----------------------------------------
export interface OutpostSpec {
	id: string;
	areaId: string;
	displayName: string;
	description: string;
	baseResourceRate: number;
	maxLevel: number;
	resourceTypes: string[];
	levelUpCosts: {
		baseCost: number;
		multiplier: number;
	};
}
