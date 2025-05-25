import { GameContext } from "@/core/GameContext";
import { OfflineProgressModal } from "@/ui/components/OfflineProgressModal";
import { BigNumber } from "./utils/BigNumber";
import { Area } from "./Area";
import { PlayerCharacter } from "./PlayerCharacter";
import { printLog } from "@/core/DebugManager";
import { formatTime } from "@/shared/utils/stringUtils";
import { bus } from "@/core/EventBus";

export interface OfflineSession {
	startTime: number;
	endTime: number;
	duration: number;
	reason: "visibility" | "beforeunload" | "startup";
}

export interface SystemOfflineCalculator {
	calculateOfflineProgress(session: OfflineSession, context: GameContext): any;
	applyOfflineProgress(progress: any, context: GameContext): void;
}

export interface OfflineProgressResult {
	hunt: OfflineHuntProgress;
	training: OfflineTrainingProgress;
	settlement: OfflineSettlementProgress;
	// Add more systems as needed
}

interface OfflineTreasureReward {
	chestsEarned: number;
	timeBreakdowns: Array<{
		interval: string;
		chestsFromInterval: number;
	}>;
	nextChestIn: number; // seconds until next chest if they stay offline
}

interface OfflineHuntProgress {
	enemiesKilled: number;
	renownGained: BigNumber;
	experienceGained: number;
	treasureChests: number;
	treasureBreakdown: Array<{
		interval: string;
		chestsFromInterval: number;
	}>;
	nextChestIn: number; // seconds until next chest if they went back offline now
	sessionDuration: number;
	areaName: string;
	efficiency: number; // 0.8 = 80% efficiency vs online play
}

interface OfflineTrainingProgress {
	statsProgressed: Record<
		string,
		{
			progressGained: number;
			levelsGained: number;
			startLevel: number;
			endLevel: number;
			statName: string;
		}
	>;
	totalLevelsGained: number;
	hasAnyProgress: boolean;
}

interface OfflineSettlementProgress {
	// If you have buildings that generate resources over time
	resourcesGenerated: Record<string, number>; // { "wood": 150, "stone": 75 }

	// If buildings can be constructed/upgraded over time
	buildingsCompleted: Array<{
		buildingId: string;
		buildingName: string;
		level: number;
	}>;

	// If you have research that progresses over time
	researchProgress: Record<
		string,
		{
			progressGained: number;
			completed: boolean;
			researchName: string;
		}
	>;

	// MINING
	miningProgress: Record<
		string,
		{
			resourceType: string;
			amountReady: number;
			maxCapacity: number;
			isFull: boolean;
		}
	>;

	hasAnyProgress: boolean;
}

export class OfflineTracker {
	private readonly timeTillOffline = 3000;

	private isOffline = false;
	private offlineStartTime: number = 0;
	private lastActiveTime: number = Date.now();
	private visibilityStartTime = 0;
	private pauseTimeout?: number;

	constructor() {
		this.setupEventListeners();
	}

	public initializeStartupCheck() {
		this.checkForOfflineOnStartup();
	}

	private setupEventListeners() {
		// PRIMARY: Tab visibility (use delayed logic)
		document.addEventListener("visibilitychange", () => {
			if (document.hidden) {
				this.handleVisibilityHidden();
			} else {
				this.handleVisibilityVisible();
			}
		});

		// MOBILE: App backgrounding (immediate pause - mobile OS throttles aggressively)
		document.addEventListener("pause", () => {
			console.log("[OfflineTracker] Mobile app paused");
			this.startOfflineSession("visibility");
		});

		document.addEventListener("resume", () => {
			console.log("[OfflineTracker] Mobile app resumed");
			if (this.isOffline) {
				this.endOfflineSession("visibility");
			}
		});

		// BROWSER CLOSING: Immediate (no delay needed)
		window.addEventListener("beforeunload", () => {
			this.startOfflineSession("beforeunload");
		});
	}

	private handleVisibilityHidden() {
		this.visibilityStartTime = Date.now();
		console.log("[OfflineTracker] Tab hidden, starting countdown...");

		// Set a timer to pause after threshold
		this.pauseTimeout = setTimeout(() => {
			console.log("[OfflineTracker] Threshold reached, pausing systems");
			this.startOfflineSession("visibility");
		}, this.timeTillOffline);
	}

	private handleVisibilityVisible() {
		console.log("[OfflineTracker] Tab visible again");

		// Cancel the pause timer if we come back quickly
		if (this.pauseTimeout) {
			clearTimeout(this.pauseTimeout);
			this.pauseTimeout = undefined;
			console.log("[OfflineTracker] Quick return - no pause needed");
		}

		// End offline session if we were actually offline
		if (this.isOffline) {
			this.endOfflineSession("visibility");
		}
	}

	private checkForOfflineOnStartup() {
		const lastSaveTime = this.getLastSaveTime();
		const now = Date.now();
		const timeDiff = now - lastSaveTime;

		// If more than 2 minutes since last save, assume we were offline
		if (timeDiff > 2000) {
			const offlineSession: OfflineSession = {
				startTime: lastSaveTime,
				endTime: now,
				duration: timeDiff,
				reason: "startup",
			};

			this.handleOfflineSession(offlineSession);
		}
	}

	private startOfflineSession(reason: OfflineSession["reason"]) {
		if (this.isOffline) return; // Already offline

		this.isOffline = true;
		this.offlineStartTime = Date.now();
		this.saveCurrentTime(); // Save when we went offline

		// Pause game systems to prevent double rewards
		this.pauseGameSystems();

		console.log(`[OfflineTracker] Started offline session: ${reason}`);
	}

	private endOfflineSession(reason: OfflineSession["reason"]) {
		if (!this.isOffline) return; // Wasn't offline

		const now = Date.now();
		const duration = now - this.offlineStartTime;

		// Resume game systems first
		this.resumeGameSystems();

		this.isOffline = false;
		this.lastActiveTime = now;

		const session: OfflineSession = {
			startTime: this.offlineStartTime,
			endTime: now,
			duration,
			reason,
		};

		console.log(`[OfflineTracker] Ended offline session: ${reason}, duration: ${duration}ms`);

		// Only process if offline for more than 1 minute
		// Should be 1800000 for 30 minutes (browser Throttling)
		if (duration > this.timeTillOffline) {
			this.handleOfflineSession(session);
		}
	}

	private pauseGameSystems() {
		// Pause hunt progress, training, etc.
		const context = GameContext.getInstance();
		context.services.offlineManager.pauseActiveSystems();
	}

	private resumeGameSystems() {
		const context = GameContext.getInstance();
		context.services.offlineManager.resumeActiveSystems();
	}

	private handleOfflineSession(session: OfflineSession) {
		// Delegate to the centralized offline manager
		const offlineManager = OfflineProgressManager.getInstance();
		offlineManager.processOfflineSession(session);
	}

	private getLastSaveTime(): number {
		const context = GameContext.getInstance();
		return context.saves.getLastActiveTime();
	}

	private saveCurrentTime() {
		const context = GameContext.getInstance();
		context.saves.updateLastActiveTime();
		// Note: This doesn't trigger full save, just updates the timestamp
		// Full save happens every 30 seconds anyway
	}

	// Public API
	public getTimeSinceLastActive(): number {
		return Date.now() - this.lastActiveTime;
	}

	public isCurrentlyOffline(): boolean {
		return this.isOffline;
	}
}

export class OfflineProgressManager {
	private static _instance: OfflineProgressManager;
	private calculators = new Map<string, SystemOfflineCalculator>();
	private offlineTracker: OfflineTracker;
	private systemsPaused = false;

	constructor() {
		this.offlineTracker = new OfflineTracker();
		this.registerCalculators();
	}

	public initalize() {
		this.offlineTracker.initializeStartupCheck();
	}

	private registerCalculators() {
		this.calculators.set("hunt", new OfflineHuntCalculator());
		this.calculators.set("training", new OfflineTrainingCalculator());
		//this.calculators.set("settlement", new OfflineSettlementCalculator());
	}

	public pauseActiveSystems() {
		this.systemsPaused = true;
		printLog("Systems Paused", 3, "OfflineProgress.ts", "offline");
		// You could emit an event that systems listen to
		bus.emit("game:systemsPaused");
	}

	public resumeActiveSystems() {
		printLog("Systems Resumed", 3, "OfflineProgress.ts", "offline");
		this.systemsPaused = false;
		bus.emit("game:systemsResumed");
	}

	public areSystemsPaused(): boolean {
		return this.systemsPaused;
	}

	public processOfflineSession(session: OfflineSession) {
		const context = GameContext.getInstance();
		const results: Partial<OfflineProgressResult> = {};
		printLog(
			`Processing Offline Session: Offline for ${formatTime(session.duration)}, reason: ${session.reason}`,
			3,
			"OfflineProgress.ts",
			"offline"
		);
		// Calculate progress for each system with proper typing
		for (const [systemName, calculator] of this.calculators) {
			try {
				const progress = calculator.calculateOfflineProgress(session, context);

				// Type-safe assignment
				switch (systemName) {
					case "hunt":
						results.hunt = progress as OfflineHuntProgress;
						printLog(`Hunt:  ${JSON.stringify(results.hunt)}`, 3, "OfflineProgress.ts", "offline");
						break;
					case "training":
						results.training = progress as OfflineTrainingProgress;
						printLog(`Training:  ${JSON.stringify(results.training)}`, 3, "OfflineProgress.ts", "offline");

						break;
					case "settlement":
						results.settlement = progress as OfflineSettlementProgress;
						break;
					default:
						console.warn(`Unknown system: ${systemName}`);
				}
			} catch (error) {
				console.error(`Error calculating offline progress for ${systemName}:`, error);
			}
		}

		this.showOfflineProgressModal(session, results);
	}

	// SHOW MODAL
	private showOfflineProgressModal(session: OfflineSession, results: Partial<OfflineProgressResult>) {
		console.log("[OfflineProgressManager] Attempting to show modal with results:", results);

		try {
			const modal = new OfflineProgressModal(session, results);
			modal.show();
			console.log("[OfflineProgressManager] Modal show() called successfully");
		} catch (error) {
			console.error("[OfflineProgressManager] Error showing modal:", error);
		}
	}

	public applyOfflineRewards(results: Partial<OfflineProgressResult>) {
		const context = GameContext.getInstance();

		// Apply rewards with proper typing
		if (results.hunt) {
			const huntCalculator = this.calculators.get("hunt") as OfflineHuntCalculator;
			huntCalculator?.applyOfflineProgress(results.hunt, context);
		}

		if (results.training) {
			const trainingCalculator = this.calculators.get("training") as OfflineTrainingCalculator;
			trainingCalculator?.applyOfflineProgress(results.training, context);
		}

		if (results.settlement) {
			//const settlementCalculator = this.calculators.get("settlement") as OfflineSettlementCalculator;
			//settlementCalculator?.applyOfflineProgress(results.settlement, context);
		}

		// Save the game after applying all rewards
		context.saves.saveAll();
	}

	static getInstance(): OfflineProgressManager {
		if (!OfflineProgressManager._instance) {
			OfflineProgressManager._instance = new OfflineProgressManager();
		}
		return OfflineProgressManager._instance;
	}
}

// Hunt system calculator
class OfflineHuntCalculator implements SystemOfflineCalculator {
	private getOfflineEfficiency(context: GameContext): number {
		let baseEfficiency = 0.8; // 80% base

		// Example upgrades:
		// if (context.settlement.hasBuilding("training_grounds")) baseEfficiency += 0.1;
		// if (context.inventory.hasItem("offline_training_manual")) baseEfficiency += 0.05;

		return Math.min(1.0, baseEfficiency); // Cap at 100%
	}

	calculateOfflineProgress(session: OfflineSession, context: GameContext): OfflineHuntProgress {
		const huntManager = context.currentRun?.huntManager;
		const currentArea = huntManager?.getActiveArea() ?? null;

		if (!currentArea) {
			return this.createEmptyProgress(session.duration);
		}

		const character = context.character;
		const offlineSeconds = session.duration / 1000;

		// Combat calculations
		const avgKillTime = this.estimateKillTimeSimple(character, currentArea);
		const efficiency = 0.8; // 80% offline efficiency
		const totalKills = Math.floor((offlineSeconds / avgKillTime) * efficiency);

		// Treasure calculations
		const treasureCalc = new OfflineTreasureCalculator();
		const treasureRewards = treasureCalc.calculateTreasureRewards(offlineSeconds);

		return {
			enemiesKilled: totalKills,
			renownGained: this.calculateRenown(totalKills, currentArea),
			experienceGained: 1, // TODOtotalKills * currentArea.baseExp,
			treasureChests: treasureRewards.chestsEarned,
			treasureBreakdown: treasureRewards.timeBreakdowns,
			nextChestIn: treasureRewards.nextChestIn,
			sessionDuration: session.duration,
			areaName: currentArea.displayName,
			efficiency,
		};
	}

	private createEmptyProgress(duration: number): OfflineHuntProgress {
		return {
			enemiesKilled: 0,
			renownGained: new BigNumber(0),
			experienceGained: 0,
			treasureChests: 0,
			treasureBreakdown: [],
			nextChestIn: 30 * 60, // 30 minutes
			sessionDuration: duration,
			areaName: "No Area",
			efficiency: 0,
		};
	}

	// Probably don't need (but good to keep)
	/* 	private estimateKillTime(character: PlayerCharacter, area: Area): number {
		// Get a sample enemy from the area to estimate stats
		const sampleEnemy = area.pickMonster(); // You might want a non-mutating version

		// Simple DPS calculation
		const playerAttack = character.attack;
		const enemyHp = sampleEnemy.scaledStats.hp;
		const enemyDefence = sampleEnergy.scaledStats.defence;

		// Effective damage per attack (minimum 1)
		const effectiveDamage = Math.max(1, playerAttack - enemyDefence * 0.1);

		// Attacks needed to kill
		const attacksNeeded = Math.ceil(enemyHp / effectiveDamage);

		// Assume 1 attack per second + variance
		const baseTimePerAttack = 1.0;
		const estimatedKillTime = attacksNeeded * baseTimePerAttack;

		// Add some randomness/inefficiency for offline play
		const variance = 0.8 + Math.random() * 0.4; // 80-120% variance

		return Math.max(5, estimatedKillTime * variance); // Minimum 5 seconds per kill
	} */

	// Alternative simpler version if you don't want to spawn enemies
	private estimateKillTimeSimple(character: PlayerCharacter, area: Area): number {
		// TODO - Work out better formala
		/*
		const playerAttack = character.attack;

		// Use area scaling to estimate enemy stats
		const baseEnemyHp = 100; // Adjust based on your game balance
		const scaledEnemyHp = baseEnemyHp * area.spec.areaScaling.hp;

		// Simple time calculation
		const timeToKill = scaledEnemyHp / playerAttack;

		// Cap between reasonable bounds
		return Math.max(5, Math.min(300, timeToKill)); // 5 sec to 5 min per enemy
		*/
		return 30;
	}

	private calculateRenown(totalKills: number, area: Area): BigNumber {
		if (totalKills === 0) return new BigNumber(0);

		// Base renown per kill for this area
		const baseRenown = 10; // Adjust based on your game balance

		// Apply area scaling
		const areaMultiplier = 1; //TODO add renown calculations area.spec.areaScaling.renown;
		const renownPerKill = baseRenown * areaMultiplier;

		// Total renown calculation
		const totalRenown = totalKills * baseRenown * renownPerKill;

		return new BigNumber(totalRenown);
	}

	applyOfflineProgress(progress: OfflineHuntProgress, context: GameContext): void {
		// Apply combat rewards
		context.player.gainExperience(progress.experienceGained);
		context.player.adjustRenown(progress.renownGained);

		// Add treasure chests to inventory
		const currentArea = context.currentRun?.huntManager.getActiveArea();
		if (currentArea && progress.treasureChests > 0) {
			// Add basic treasure chests - you can implement this however you want
			for (let i = 0; i < progress.treasureChests; i++) {
				context.inventory.addLootById("basic_treasure_chest"); // or whatever ID you use
			}
		}
	}
}

// Training system calculator
class OfflineTrainingCalculator implements SystemOfflineCalculator {
	calculateOfflineProgress(session: OfflineSession, context: GameContext): OfflineTrainingProgress {
		if (!context.currentRun?.trainedStats) {
			return {
				statsProgressed: {},
				totalLevelsGained: 0,
				hasAnyProgress: false,
			};
		}

		const trainedStats = context.currentRun.trainedStats;
		const offlineSeconds = session.duration / 1000;

		// Properly typed progress object
		const progressMade: Record<
			string,
			{
				progressGained: number;
				levelsGained: number;
				startLevel: number;
				endLevel: number;
				statName: string;
			}
		> = {};

		let totalLevelsGained = 0;

		// Calculate progress for each active trained stat
		for (const [statId, trainedStat] of trainedStats.stats) {
			if (trainedStat.assignedPoints > 0) {
				const progressGained = trainedStat.assignedPoints * trainedStat.baseGainRate * offlineSeconds;
				const levelsGained = Math.floor(progressGained / trainedStat.nextThreshold);

				progressMade[statId] = {
					progressGained,
					levelsGained,
					startLevel: trainedStat.level,
					endLevel: trainedStat.level + levelsGained,
					statName: trainedStat.name,
				};

				totalLevelsGained += levelsGained;
			}
		}

		return {
			statsProgressed: progressMade,
			totalLevelsGained,
			hasAnyProgress: totalLevelsGained > 0,
		};
	}

	applyOfflineProgress(progress: OfflineTrainingProgress, context: GameContext): void {
		const trainedStats = context.currentRun?.trainedStats;
		if (!trainedStats) return;

		for (const [statId, progressData] of Object.entries(progress.statsProgressed)) {
			const trainedStat = trainedStats.stats.get(statId);
			if (trainedStat && progressData.progressGained > 0) {
				// Calculate equivalent tick time
				const equivalentTickTime = progressData.progressGained / (trainedStat.baseGainRate * trainedStat.assignedPoints);

				trainedStat.handleTick(equivalentTickTime);
			}
		}
	}
}

class OfflineSettlementCalculator implements SystemOfflineCalculator {
	calculateOfflineProgress(session: OfflineSession, context: GameContext): OfflineSettlementProgress {
		const offlineSeconds = session.duration / 1000;
		const miningProgress = {};

		// For each active mine
		const activeMines = context.settlement.getActiveMines();
		for (const mine of activeMines) {
			const productionRate = mine.getProductionRate(); // per second
			const maxCapacity = mine.getMaxCapacity();
			const currentAmount = mine.getCurrentAmount();

			const newAmount = Math.min(maxCapacity, currentAmount + productionRate * offlineSeconds);

			miningProgress[mine.id] = {
				resourceType: mine.resourceType,
				amountReady: newAmount,
				maxCapacity,
				isFull: newAmount >= maxCapacity,
			};
		}

		return {
			resourcesGenerated: 0,
			buildingsCompleted: 0,
			miningProgress,
			hasAnyProgress: Object.keys(miningProgress).length > 0,
		};
	}

	applyOfflineProgress(progress: OfflineTrainingProgress, context: GameContext): void {
		// TODO
	}
}

// ------------- TREASURE CHEST CALCULATOR --------------------

class OfflineTreasureCalculator {
	// Escalating intervals in seconds
	private readonly chestIntervals = [
		30 * 60, // 30 minutes
		60 * 60, // 1 hour
		2 * 60 * 60, // 2 hours
		4 * 60 * 60, // 4 hours
		8 * 60 * 60, // 8 hours (cap - repeats every 8h after this)
	];

	calculateTreasureRewards(offlineSeconds: number): OfflineTreasureReward {
		let remainingTime = offlineSeconds;
		let totalChests = 0;
		const breakdown = [];
		let intervalIndex = 0;

		// Work through each escalating interval
		while (remainingTime > 0 && intervalIndex < this.chestIntervals.length) {
			const currentInterval = this.chestIntervals[intervalIndex];

			if (remainingTime >= currentInterval) {
				remainingTime -= currentInterval;
				totalChests++;

				breakdown.push({
					interval: this.formatInterval(currentInterval),
					chestsFromInterval: 1,
				});

				intervalIndex++;
			} else {
				break; // Not enough time for next chest
			}
		}

		// After all intervals, repeat the longest one (8h cycles)
		if (remainingTime > 0 && intervalIndex >= this.chestIntervals.length) {
			const finalInterval = this.chestIntervals[this.chestIntervals.length - 1];
			const additionalChests = Math.floor(remainingTime / finalInterval);

			if (additionalChests > 0) {
				totalChests += additionalChests;
				breakdown.push({
					interval: `${this.formatInterval(finalInterval)} (×${additionalChests})`,
					chestsFromInterval: additionalChests,
				});
				remainingTime -= additionalChests * finalInterval;
			}
		}

		// Calculate when next chest would arrive
		const nextInterval =
			intervalIndex < this.chestIntervals.length
				? this.chestIntervals[intervalIndex] - remainingTime
				: this.chestIntervals[this.chestIntervals.length - 1] - remainingTime;

		return {
			chestsEarned: totalChests,
			timeBreakdowns: breakdown,
			nextChestIn: Math.max(0, nextInterval),
		};
	}

	private formatInterval(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);

		if (hours > 0) return `${hours}h`;
		return `${minutes}m`;
	}
}
