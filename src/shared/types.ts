export type ScreenName = 'settlement'| 'character' | 'hunt' | 'inventory' | 'research' | 'train' | 'blacksmith';

export type Rarity = "common"|"uncommon"|"rare"|"epic"|"legendary"|"unique";
export type ItemCategory = "equipment" | "classCard" | "consumable";


// Used for inventory items
export interface InventoryItem {
    /** Unique across all items in the player’s inventory */
    id: string;
  
    /** Used for slot-type checks, e.g. only drop into a `data-slot="head"` */
    category: ItemCategory;
  
    /** Display */
    name: string;
    iconUrl: string;
  
    /** For border color & sorting */
    rarity?: Rarity;
  
    /** How many the player has; equipment & cards would just be 1 */
    quantity: number;
  }

