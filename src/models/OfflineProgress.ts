/**
 * offlineProgress.ts (Simplified Version)
 *
 * Much cleaner approach:
 * - Systems implement OfflineProgressHandler if they support offline progress
 * - Most systems just get time delta and handle it internally
 * - Only hunt system provides detailed feedback for UI
 * - All balance values centralized in GameBalance.ts
 */

import { GameContext } from "@/core/GameContext";
import { OfflineProgressModal } from "@/ui/components/OfflineProgressModal";
import { BigNumber } from "./utils/BigNumber";
import { Area } from "./Area";
import { PlayerCharacter } from "./PlayerCharacter";
import { printLog } from "@/core/DebugManager";
import { formatTime } from "@/shared/utils/stringUtils";
import { bus } from "@/core/EventBus";
import { GAME_BALANCE } from "@/balance/GameBalance";

/* -------------------------------------------------------------------------- */
/*                               TYPES & INTERFACES                           */
/* -------------------------------------------------------------------------- */

export enum OfflineReason {
	Visibility = "visibility",
	BeforeUnload = "beforeunload",
	Startup = "startup",
}

export interface OfflineSession {
	startTime: number;
	endTime: number;
	duration: number;
	reason: OfflineReason;
}

/**
 * Simple interface for systems that want to handle offline progress.
 * Most systems will just implement this and handle the time internally.
 */
export interface OfflineProgressHandler {
	/**
	 * Handle offline progress for this system.
	 * @param offlineSeconds - How long the player was offline
	 * @returns Optional detailed progress info for UI (hunt system only)
	 */
	handleOfflineProgress(offlineSeconds: number): OfflineProgressInfo | null;
}

/**
 * Only hunt system returns detailed info - everything else returns null
 */
export interface OfflineProgressInfo {
	enemiesKilled: number;
	renownGained: BigNumber;
	experienceGained: BigNumber;
	treasureChests: number;
	treasureBreakdown: Array<{ interval: string; chestsFromInterval: number }>;
	nextChestIn: number;
	sessionDuration: number;
	areaName: string;
	efficiency: number;
}

export interface OfflineModalData {
	hunt?: OfflineProgressInfo;
	systemsUpdated: string[];
	totalOfflineTime: number;
}

/* -------------------------------------------------------------------------- */
/*                               OFFLINE TRACKER                              */
/* -------------------------------------------------------------------------- */

export class OfflineTracker {
	private isOffline = false;
	private offlineStart = 0;
	private lastActive = Date.now();
	private pauseTimer?: ReturnType<typeof setTimeout>;

	constructor() {
		this.setupEventListeners();
	}

	public initializeStartupCheck() {
		const lastSave = this.getLastSaveTime();
		const idleTime = Date.now() - lastSave;

		if (idleTime > GAME_BALANCE.offline.startupStaleTime_MS) {
			this.handleOfflineSession({
				startTime: lastSave,
				endTime: Date.now(),
				duration: idleTime,
				reason: OfflineReason.Startup,
			});
		}
	}

	private setupEventListeners() {
		document.addEventListener("visibilitychange", () => (document.hidden ? this.onTabHidden() : this.onTabVisible()));

		document.addEventListener("pause", () => this.startOffline(OfflineReason.Visibility));
		document.addEventListener("resume", () => this.endOffline(OfflineReason.Visibility));
		window.addEventListener("beforeunload", () => this.startOffline(OfflineReason.BeforeUnload));
	}

	private onTabHidden() {
		this.pauseTimer = setTimeout(() => this.startOffline(OfflineReason.Visibility), GAME_BALANCE.offline.offlineThreshold_MS);
	}

	private onTabVisible() {
		if (this.pauseTimer) {
			clearTimeout(this.pauseTimer);
			this.pauseTimer = undefined;
		}
		if (this.isOffline) this.endOffline(OfflineReason.Visibility);
	}

	private startOffline(reason: OfflineReason) {
		if (this.isOffline) return;
		this.isOffline = true;
		this.offlineStart = Date.now();
		this.saveCurrentTime();
		this.pauseGameSystems();
		printLog(`▶ Offline (${reason})`, 3, "OfflineTracker", "offline");
	}

	private endOffline(reason: OfflineReason) {
		if (!this.isOffline) return;
		this.resumeGameSystems();
		this.isOffline = false;

		const now = Date.now();
		const session: OfflineSession = {
			startTime: this.offlineStart,
			endTime: now,
			duration: now - this.offlineStart,
			reason,
		};

		printLog(`◀ Online (${reason}) after ${formatTime(session.duration)}`, 3, "OfflineTracker", "offline");

		if (session.duration >= GAME_BALANCE.offline.offlineThreshold_MS) {
			this.handleOfflineSession(session);
		}
		this.lastActive = now;
	}

	private pauseGameSystems() {
		GameContext.getInstance().services.offlineManager.pauseActiveSystems();
	}

	private resumeGameSystems() {
		GameContext.getInstance().services.offlineManager.resumeActiveSystems();
	}

	private handleOfflineSession(session: OfflineSession) {
		GameContext.getInstance().services.offlineManager.processOfflineSession(session);
	}

	private getLastSaveTime() {
		return GameContext.getInstance().saves.getLastActiveTime();
	}

	private saveCurrentTime() {
		GameContext.getInstance().saves.updateLastActiveTime();
	}

	public getTimeSinceLastActive() {
		return Date.now() - this.lastActive;
	}

	public isCurrentlyOffline() {
		return this.isOffline;
	}
}

/* -------------------------------------------------------------------------- */
/*                           OFFLINE PROGRESS MANAGER                         */
/* -------------------------------------------------------------------------- */

export class OfflineProgressManager {
	private readonly handlers = new Map<string, OfflineProgressHandler>();
	private readonly tracker = new OfflineTracker();
	private systemsPaused = false;
	private initialized = false;



	public initalize() {
		// Keep typo to match existing GameApp.ts call
		if (this.initialized) return;
		this.initialized = true;
		this.registerHandlers();
		this.tracker.initializeStartupCheck();
	}

	/**
	 * Register systems that support offline progress.
	 * Systems implement OfflineProgressHandler interface directly!
	 */
	private registerHandlers() {
		const context = GameContext.getInstance();

		// Hunt system provides detailed feedback
		this.handlers.set("Hunt", new HuntOfflineHandler());

		// Other systems implement the interface directly - no wrapper needed!
		if (context.library) {
			this.handlers.set("Research", context.library);
		}

		if (context.currentRun?.trainedStats) {
			this.handlers.set("Training", context.currentRun.trainedStats);
		}

		// Add more as systems are implemented:
		// if (context.settlement) {
		//     this.handlers.set("Settlement", context.settlement);
		// }
	}

	public pauseActiveSystems() {
		this.systemsPaused = true;
		bus.emit("game:systemsPaused");
	}

	public resumeActiveSystems() {
		this.systemsPaused = false;
		bus.emit("game:systemsResumed");
	}

	public areSystemsPaused() {
		return this.systemsPaused;
	}

	public processOfflineSession(session: OfflineSession) {
		const offlineSeconds = session.duration / 1000;
		const modalData: OfflineModalData = {
			systemsUpdated: [],
			totalOfflineTime: session.duration,
		};

		// Process each registered handler
		for (const [name, handler] of this.handlers) {
			try {
				const result = handler.handleOfflineProgress(offlineSeconds);

				// Only hunt returns detailed info
				if (result && name === "Hunt") {
					modalData.hunt = result;
				}

				// Track which systems got updated
				modalData.systemsUpdated.push(name);
			} catch (err) {
				console.error(`⚠️ Error processing offline progress for ${name}:`, err);
			}
		}

		this.showOfflineModal(session, modalData);
	}

	private showOfflineModal(session: OfflineSession, data: OfflineModalData) {
		try {
			new OfflineProgressModal(session, data).show();
		} catch (err) {
			console.error("⚠️ Could not show OfflineProgressModal:", err);
		}
	}
}

/* -------------------------------------------------------------------------- */
/*                               SYSTEM HANDLERS                              */
/* -------------------------------------------------------------------------- */

/**
 * Hunt system handler - provides detailed feedback for the modal
 */
class HuntOfflineHandler implements OfflineProgressHandler {
	private readonly treasure = new OfflineTreasureCalculator();

	handleOfflineProgress(offlineSeconds: number): OfflineProgressInfo | null {
		const context = GameContext.getInstance();
		const area = context.currentRun?.huntManager.getActiveArea();

		if (!area) {
			return {
				enemiesKilled: 0,
				renownGained: new BigNumber(0),
				experienceGained: new BigNumber(0),
				treasureChests: 0,
				treasureBreakdown: [],
				nextChestIn: 30 * 60,
				sessionDuration: offlineSeconds * 1000,
				areaName: "No Area Active",
				efficiency: 0,
			};
		}

		const character = context.character;
		const avgKillTime = GAME_BALANCE.offline.estimatedKillTimeSec;
		const efficiency = GAME_BALANCE.offline.defaultOfflineEfficiency;
		const kills = Math.floor((offlineSeconds / avgKillTime) * efficiency);

		// Apply the rewards directly here since we're calculating them
		const renownGained = new BigNumber(kills * area.tier);
		const xpGained = new BigNumber(kills).multiply(area.getXpPerKill(false));

		context.player.adjustRenown(renownGained);
		context.character.gainXp(xpGained);

		const chests = this.treasure.calculateTreasureRewards(offlineSeconds);
		if (chests.chestsEarned > 0) {
			for (let i = 0; i < chests.chestsEarned; i++) {
				context.inventory.addLootById("basic_treasure_chest");
			}
		}

		return {
			enemiesKilled: kills,
			renownGained,
			experienceGained: xpGained,
			treasureChests: chests.chestsEarned,
			treasureBreakdown: chests.timeBreakdowns,
			nextChestIn: chests.nextChestIn,
			sessionDuration: offlineSeconds * 1000,
			areaName: area.displayName,
			efficiency,
		};
	}
}

/**
 * For other systems, just implement the interface directly in your system class:
 *
 * export class LibraryManager implements OfflineProgressHandler {
 *     // ... existing code ...
 *
 *     handleOfflineProgress(offlineSeconds: number): null {
 *         this.handleTick(offlineSeconds);
 *         return null;
 *     }
 * }
 */

/* -------------------------------------------------------------------------- */
/*                            TREASURE CALCULATOR                             */
/* -------------------------------------------------------------------------- */

class OfflineTreasureCalculator {
	calculateTreasureRewards(offlineSeconds: number) {
		const intervals = GAME_BALANCE.offline.chestIntervalsSec;
		let time = offlineSeconds;
		let earned = 0;
		const breakdown: Array<{ interval: string; chestsFromInterval: number }> = [];

		// Process escalating intervals
		for (let i = 0; i < intervals.length && time >= intervals[i]; i++) {
			time -= intervals[i];
			earned++;
			breakdown.push({
				interval: this.formatTime(intervals[i]),
				chestsFromInterval: 1,
			});
		}

		// Process remaining time with final interval
		if (time > 0) {
			const finalInterval = intervals[intervals.length - 1];
			const extraChests = Math.floor(time / finalInterval);
			if (extraChests > 0) {
				earned += extraChests;
				breakdown.push({
					interval: `${this.formatTime(finalInterval)} ×${extraChests}`,
					chestsFromInterval: extraChests,
				});
				time -= extraChests * finalInterval;
			}
		}

		// Calculate time until next chest
		const nextChestInterval = earned < intervals.length ? intervals[earned] : intervals[intervals.length - 1];
		const nextChestIn = nextChestInterval - time;

		return {
			chestsEarned: earned,
			timeBreakdowns: breakdown,
			nextChestIn,
		};
	}

	private formatTime(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		return hours > 0 ? `${hours}h` : `${minutes}m`;
	}
}
