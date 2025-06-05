import { ItemRarity, ITEM_RARITIES } from "@/shared/types";

export interface UpgradableItem {
    readonly level: number;
    readonly rarity: ItemRarity | undefined;
    addLevels(amount: number): void;
}

export function getNextRarity(rarity: ItemRarity): ItemRarity {
    const idx = ITEM_RARITIES.indexOf(rarity);
    return ITEM_RARITIES[Math.min(idx + 1, ITEM_RARITIES.length - 1)];
}
