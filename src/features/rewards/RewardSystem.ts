import { GameContext } from "@/core/GameContext";
import { bus } from "@/core/EventBus";
import { Area } from "@/models/Area";
import { BalanceCalculators } from "@/balance/GameBalance";
import { GameBase } from "@/core/GameBase";
import { RecruitProfession } from "@/models/Recruit";

interface RewardSpec {
	type: "equipment" | "gold" | "xp" | "chest" | "recruit" | "story" | "rune" | "renown";
	data: any;
	source: string; // for debugging: "combat:area1", "milestone:level10"
}

interface RewardContext {
	source: "combat" | "offline" | "story" | "milestone" | "exploration";
	area?: Area;
	isOffline?: boolean;
	multiplier?: number;
	tags?: string[]; // for filtering what rewards are allowed
	enemyId?: string; // for kill bonus calculations in combat
	enemyRarity?: string; // for renown calculation
}

interface RewardSummary {
	loot: string[];
	xp: number;
	gold: number;
	renown: number;
	recruit: any | null;
	chests: any[];
	other: RewardSpec[];
}

// =============================================
// MAIN REWARD SYSTEM - Single entry point
// =============================================

export class RewardSystem extends GameBase {
	constructor() {
		super();
		this.setupFeatureUnlock("feature.recruits", () => {
			console.log("Recruit system unlocked! Recruits can now drop from combat.");
		});
	}

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

		// Recruits (if feature is unlocked)
		if (this.isFeatureActive() && this.shouldDropRecruit(context)) {
			const recruitData = this.generateRecruitDrop(context);
			if (recruitData) {
				rewards.push({
					type: "recruit",
					data: recruitData,
					source,
				});
			}
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

	private giveRenown(reward: RewardSpec): void {
		this.context.player.adjustRenown(reward.data.amount);
		this.context.inventory.awardRenownToEquipped(reward.data.amount);
		this.context.settlement.modifySettlementRenown(reward.data.amount);
		bus.emit("renown:changed", reward.data.amount);
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
		if (!this.isFeatureActive()) {
			console.warn("Recruit feature not unlocked yet, skipping recruit reward");
			return;
		}

		const { profession } = reward.data;
		const recruit = this.context.recruits.createRecruit(profession);

		// Emit event for UI notification
		bus.emit("recruit:found", { recruit, source: reward.source });
		console.log(`Found a new ${profession} recruit: ${recruit.id}!`);
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

	// =============================================
	// MANUAL REWARD CREATION - For story/milestones
	// =============================================

	public createManualReward(type: RewardSpec["type"], data: any, source: string): RewardSpec {
		return { type, data, source };
	}

	public awardManualRewards(rewards: RewardSpec[]): void {
		this.distributeRewards(rewards);
	}

	// =============================================
	// UTILITY METHODS - For UI and reporting
	// =============================================

	public summarizeRewards(rewards: RewardSpec[]): RewardSummary {
		const summary: RewardSummary = {
			loot: [],
			xp: 0,
			gold: 0,
			renown: 0,
			recruit: null,
			chests: [],
			other: [],
		};

		rewards.forEach((reward) => {
			switch (reward.type) {
				case "equipment":
					summary.loot.push(reward.data.itemId);
					break;
				case "xp":
					summary.xp += reward.data.amount;
					break;
				case "gold":
					summary.gold += reward.data.amount;
					break;
				case "renown":
					summary.renown += reward.data.amount;
					break;
				case "recruit":
					summary.recruit = reward.data;
					break;
				case "chest":
					summary.chests.push(reward.data);
					break;
				default:
					summary.other.push(reward);
					break;
			}
		});

		return summary;
	}

	// Alternative: Get just specific reward types
	public getRewardsByType<T = any>(rewards: RewardSpec[], type: RewardSpec["type"]): T[] {
		return rewards.filter((reward) => reward.type === type).map((reward) => reward.data);
	}

	// Alternative: Get total amount for stackable rewards
	public getTotalAmount(rewards: RewardSpec[], type: "gold" | "xp" | "renown"): number {
		return rewards.filter((reward) => reward.type === type).reduce((total, reward) => total + reward.data.amount, 0);
	}

	private calculateGoldReward(context: RewardContext): number {
		if (!context.area) return 0;

		// Check if this is a boss fight
		const isBoss = context.enemyId === context.area.boss.monsterId;

		// Use your existing BalanceCalculators
		return BalanceCalculators.getGoldReward(context.area.tier, isBoss, "common");
	}

	private calculateXpReward(context: RewardContext): number {
		if (!context.area) return 0;

		const baseXp = context.area.getXpPerKill(false);

		// Apply kill bonus if we have enemy ID (combat context)
		if (context.enemyId && context.source === "combat") {
			const kills = this.context.stats.getEnemyStats(context.enemyId).killsTotal;
			const xpBonusPct = BalanceCalculators.getEnemyKillXpBonus(kills);
			return Math.floor(baseXp * (1 + xpBonusPct / 100));
		}

		// Apply offline efficiency if applicable
		if (context.isOffline && context.multiplier) {
			return Math.floor(baseXp * context.multiplier);
		}

		return baseXp;
	}

	// =============================================
	// RECRUIT GENERATION LOGIC
	// =============================================

	private shouldDropRecruit(context: RewardContext): boolean {
		if (!context.area) return false;

		// Base drop chance: 2% for normal areas, 5% for boss areas
		// Note: boss detection happens at enemy level, not area level
		const baseChance = 0.02;

		// Slightly higher chance in higher tier areas
		const tierBonus = context.area.tier * 0.005;

		const finalChance = baseChance + tierBonus;
		return Math.random() < finalChance;
	}

	private generateRecruitDrop(context: RewardContext): { profession: RecruitProfession } | null {
		if (!context.area) return null;

		// Available professions based on area tier
		const availableProfessions = this.getAvailableRecruitProfessions(context.area.tier);

		if (availableProfessions.length === 0) return null;

		// Random profession from available ones
		const profession = availableProfessions[Math.floor(Math.random() * availableProfessions.length)];

		return { profession };
	}

	private getAvailableRecruitProfessions(areaTier: number): RecruitProfession[] {
		const professions: RecruitProfession[] = [];

		// Use the actual RecruitProfession types from the model
		const allProfessions: RecruitProfession[] = ["blacksmith", "apothecary", "scout", "miner", "librarian", "builder"];

		// For now, return all professions - could be filtered by tier later
		professions.push(...allProfessions);

		return professions;
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
