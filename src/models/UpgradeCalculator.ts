import { getNextRarity, ItemRarity } from "@/shared/types";
// UpgradeCalculator.ts - Pure calculation logic
export class UpgradeCalculator {
    static calculate(currentLevel: number, currentRarity: ItemRarity, levelsToAdd: number) {
        let level = currentLevel + levelsToAdd;
        let rarity = currentRarity;

        while (level >= 100) {
            level -= 100;
            rarity = getNextRarity(rarity);
        }

        return {
            newLevel: Math.max(level, 1),
            newRarity: rarity,
            upgradedRarity: rarity !== currentRarity,
        };
    }
}
