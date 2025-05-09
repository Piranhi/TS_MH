export type ScreenName = 'settlement'| 'character' | 'hunt' | 'inventory' | 'research' | 'train' | 'blacksmith';

export type Rarity = "common"|"uncommon"|"rare"|"epic"|"legendary"|"unique";
export type ItemCategory = "equipment" | "classCard" | "consumable";
export type equipmentType = "head" | "back" | "chest" | "legs" | "feet" | "hands" | "finger1" | "finger2" | "neck" | "weapon"


// Used for inventory items
export interface InventoryItem {
    id: string;
    category: ItemCategory;
    name: string;
    iconUrl: string;
    rarity?: Rarity;
    quantity: number;
  }

  export interface EquipmentItem extends InventoryItem{
    id: string;
    category: "equipment";
    name: string;
    iconUrl: string;
    rarity?: Rarity;
    quantity: number;
    equipType: equipmentType;
  }

    export interface classCardItem extends InventoryItem{
    id: string;
    category: "equipment";
    name: string;
    iconUrl: string;
    rarity?: Rarity;
    quantity: number;
    equipType: equipmentType;
  }


