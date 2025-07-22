// =============================================
// CORE INTERFACES - Keep these simple!
// =============================================

import { GameContext } from "@/core/GameContext";
import { bus } from "@/core/EventBus";
import { Area } from "@/models/Area";
import { BalanceCalculators } from "@/balance/GameBalance";

interface RewardSpec {
	type: "equipment" | "gold" | "xp" | "chest" | "recruit" | "story" | "rune";
	data: any;
	source: string; // for debugging: "combat:area1", "milestone:level10"
}

interface RewardContext {
	source: "combat" | "offline" | "story" | "milestone" | "exploration";
	area?: Area;
	isOffline?: boolean;
	multiplier?: number;
	tags?: string[]; // for filtering what rewards are allowed
}

// =============================================
// MAIN REWARD SYSTEM - Single entry point
// =============================================

export class RewardSystem {
	constructor() {}

	private get context(): GameContext {
		return GameContext.getInstance();
	}

	// Generate + Distribute in one call for convenience
	public awardRewards(context: RewardContext): RewardSpec[] {
		const rewards = this.generateRewards(context);
		this.distributeRewards(rewards);
		return rewards;
	}

	// Generate rewards based on context
	public generateRewards(context: RewardContext): RewardSpec[] {
		const rewards: RewardSpec[] = [];

		switch (context.source) {
			case "combat":
				rewards.push(...this.generateCombatRewards(context));
				break;
			case "offline":
				rewards.push(...this.generateOfflineRewards(context));
				break;
			case "story":
			case "milestone":
			case "exploration":
				// These will be manually crafted rewards, not random
				break;
		}

		return rewards;
	}

	// Actually give rewards to the player
	public distributeRewards(rewards: RewardSpec[]): void {
		for (const reward of rewards) {
			this.distributeReward(reward);
		}
	}

	// =============================================
	// REWARD GENERATORS - One per source type
	// =============================================

	private generateCombatRewards(context: RewardContext): RewardSpec[] {
		if (!context.area) return [];

		const rewards: RewardSpec[] = [];
		const source = `combat:${context.area.id}`;

		// Equipment loot (your existing system)
		const lootIds = context.area.rollLoot();
		for (const itemId of lootIds) {
			rewards.push({
				type: "equipment",
				data: { itemId, quantity: 1 },
				source,
			});
		}

		// Gold (already in your combat system)
		const goldAmount = this.calculateGoldReward(context);
		if (goldAmount > 0) {
			rewards.push({
				type: "gold",
				data: { amount: goldAmount },
				source,
			});
		}

		// XP (already in your combat system)
		const xpAmount = this.calculateXpReward(context);
		if (xpAmount > 0) {
			rewards.push({
				type: "xp",
				data: { amount: xpAmount },
				source,
			});
		}

		return rewards;
	}

	private generateOfflineRewards(context: RewardContext): RewardSpec[] {
		if (!context.area) return [];

		const rewards: RewardSpec[] = [];
		const source = `offline:${context.area.id}`;

		// Offline gets chests instead of individual items
		const chestCount = Math.floor(Math.random() * 3) + 1; // 1-3 chests
		for (let i = 0; i < chestCount; i++) {
			rewards.push({
				type: "chest",
				data: {
					tier: context.area.tier,
					contents: context.area.rollOfflineLoot(), // your existing method
				},
				source,
			});
		}

		// Reduced gold and XP
		const goldAmount = this.calculateGoldReward(context) * 0.7; // 70% of normal
		const xpAmount = this.calculateXpReward(context) * 0.5; // 50% of normal

		if (goldAmount > 0) {
			rewards.push({ type: "gold", data: { amount: goldAmount }, source });
		}
		if (xpAmount > 0) {
			rewards.push({ type: "xp", data: { amount: xpAmount }, source });
		}

		return rewards;
	}

	// =============================================
	// REWARD DISTRIBUTORS - One per reward type
	// =============================================

	private distributeReward(reward: RewardSpec): void {
		switch (reward.type) {
			case "equipment":
				this.giveEquipment(reward);
				break;
			case "gold":
				this.giveGold(reward);
				break;
			case "xp":
				this.giveXp(reward);
				break;
			case "chest":
				this.giveChest(reward);
				break;
			case "recruit":
				this.giveRecruit(reward);
				break;
			case "story":
				this.giveStoryItem(reward);
				break;
			case "rune":
				this.giveRune(reward);
				break;
		}
	}

	private giveEquipment(reward: RewardSpec): void {
		const { itemId, quantity } = reward.data;
		this.context.inventory.addLootById(itemId, quantity);
		// Emit event for UI
		bus.emit("inventory:dropped", [itemId]);
	}

	private giveGold(reward: RewardSpec): void {
		this.context.player.adjustGold(reward.data.amount);
	}

	private giveXp(reward: RewardSpec): void {
		this.context.character.gainXp(reward.data.amount);
	}

	private giveChest(reward: RewardSpec): void {
		const { tier, contents } = reward.data;
		// For now, just give the contents directly
		// Later you could add to a "chest inventory" for player to open
		for (const itemId of contents) {
			this.giveEquipment({
				type: "equipment",
				data: { itemId, quantity: 1 },
				source: reward.source,
			});
		}

		// Emit special chest event
		bus.emit("reward:chestOpened", { tier, contents, source: reward.source });
	}

	private giveRecruit(reward: RewardSpec): void {
		// TODO: Implement when you add recruit system
		console.log("Recruit reward not implemented yet:", reward);
	}

	private giveStoryItem(reward: RewardSpec): void {
		// TODO: Add to story inventory
		console.log("Story item reward not implemented yet:", reward);
	}

	private giveRune(reward: RewardSpec): void {
		// TODO: Add to rune inventory
		console.log("Rune reward not implemented yet:", reward);
	}

	// =============================================
	// HELPER METHODS - Reuse your existing logic
	// =============================================

	private calculateGoldReward(context: RewardContext): number {
		if (!context.area) return 0;
		// Use your existing BalanceCalculators
		return BalanceCalculators.getGoldReward(context.area.tier, false, "common");
	}

	private calculateXpReward(context: RewardContext): number {
		if (!context.area) return 0;
		return context.area.getXpPerKill(false);
	}

	// =============================================
	// MANUAL REWARD CREATION - For story/milestones
	// =============================================

	public createManualReward(type: RewardSpec["type"], data: any, source: string): RewardSpec {
		return { type, data, source };
	}

	public awardManualRewards(rewards: RewardSpec[]): void {
		this.distributeRewards(rewards);
	}
}

// =============================================
// USAGE EXAMPLES
// =============================================

// In CombatManager.rewardPlayer():
/*
const rewards = this.context.services.rewardSystem.awardRewards({
  source: 'combat',
  area: this.area,
  isOffline: false
});

bus.emit("combat:postCombatReport", {
  enemy: this.enemyCharacter,
  area: this.area,
  rewards: rewards
});
*/

// For story events:
/*
const storyRewards = [
  this.context.services.rewardSystem.createManualReward('gold', { amount: 500 }, 'story:chapter1'),
  this.context.services.rewardSystem.createManualReward('equipment', { itemId: 'legendary_sword', quantity: 1 }, 'story:chapter1')
];
this.context.services.rewardSystem.awardManualRewards(storyRewards);
*/

// For milestones:
/*
const milestoneRewards = [
  this.context.services.rewardSystem.createManualReward('chest', { tier: 3, contents: ['rare_helm', 'rare_boots'] }, 'milestone:level50')
];
this.context.services.rewardSystem.awardManualRewards(milestoneRewards);
*/
