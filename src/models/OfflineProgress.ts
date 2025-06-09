/**
 * offlineProgress.ts
 *
 * Handles detection of the player leaving the game (tab hidden / browser closed / app backgrounded)
 * and calculates / applies idle rewards for each game subsystem (hunt, training, settlement ...).
 *
 * ───────────────────────────────────────────────────────────────────────────────
 * MODULE STRUCTURE
 *  1. Global configuration & shared types
 *  2. OfflineTracker      – Detects when the player goes inactive
 *  3. OfflineProgressManager – Coordinates calculators & shows modal
 *  4. System calculators  – Hunt, Training, Settlement
 *  5. Utility: Treasure chest calculation
 *
 * Keep‑Alives:
 *  - All constants are grouped at the very top → easier balancing
 *  - Every public class exposes a *tiny* surface area (single public method set)
 *
 * Simplification tip:
 *  You can remove any subsystem you are not using yet by commenting its calculator in
 *  registerCalculators() – nothing else needs to change.
 *
 * ───────────────────────────────────────────────────────────────────────────────
 **/

/* -------------------------------------------------------------------------- */
/*                         1. GLOBAL CONFIG & TYPES                           */
/* -------------------------------------------------------------------------- */

import { GameContext } from "@/core/GameContext";
import { OfflineProgressModal } from "@/ui/components/OfflineProgressModal";
import { BigNumber } from "./utils/BigNumber";
import { Area } from "./Area";
import { PlayerCharacter } from "./PlayerCharacter";
import { printLog } from "@/core/DebugManager";
import { formatTime } from "@/shared/utils/stringUtils";
import { bus } from "@/core/EventBus";
import { GAME_BALANCE } from "@/balance/GameBalance";

/**
 * Reasons why we entered / left an offline state.
 * Switched from a union‑string‑literal to a real enum for type‑safety & re‑usability.
 */
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

/** Contract every subsystem must fulfil to support offline rewards. */
export interface SystemOfflineCalculator<TProgress = unknown> {
	/** Compute rewards; *never* mutate context here. */
	calculateOfflineProgress(session: OfflineSession, context: GameContext): TProgress;
	/** Apply rewards & side effects. */
	applyOfflineProgress(progress: TProgress, context: GameContext): void;
}

/* --------------- Result DTOs returned by individual calculators ------------ */

export interface OfflineProgressResult {
	hunt?: OfflineHuntProgress;
	training?: OfflineTrainingProgress;
	settlement?: OfflineSettlementProgress;
	research?: OfflineResearchProgress;
}

interface OfflineTreasureReward {
	chestsEarned: number;
	timeBreakdowns: Array<{ interval: string; chestsFromInterval: number }>;
	nextChestIn: number; // secs
}

interface OfflineHuntProgress {
	enemiesKilled: number;
	renownGained: BigNumber;
	experienceGained: BigNumber;
	treasureChests: number;
	treasureBreakdown: OfflineTreasureReward["timeBreakdowns"];
	nextChestIn: number;
	sessionDuration: number; // ms
	areaName: string;
	efficiency: number; // 0.8 → 80 %
}

// Define the research progress interface
interface OfflineResearchProgress {
	researchCompleted: Array<{
		id: string;
		name: string;
		startProgress: number;
		endProgress: number;
		completed: boolean;
	}>;
	researchInProgress: Array<{
		id: string;
		name: string;
		progressGained: number;
		percentComplete: number;
	}>;
	totalCompleted: number;
	hasAnyProgress: boolean;
	offlineSeconds: number;
}

interface OfflineTrainingProgress {
	statsProgressed: Record<
		string,
		{
			offlineSeconds: number;
			estimatedLevels: number;
			startLevel: number;
			endLevel: number;
			statName: string;
		}
	>;
	totalLevelsGained: number;
	hasAnyProgress: boolean;
}

interface OfflineSettlementProgress {
	resourcesGenerated: Record<string, number>;
	buildingsCompleted: Array<{
		buildingId: string;
		buildingName: string;
		level: number;
	}>;
	researchProgress: Record<
		string,
		{
			progressGained: number;
			completed: boolean;
			researchName: string;
		}
	>;
	miningProgress: Record<string, { resourceType: string; amountReady: number; maxCapacity: number; isFull: boolean }>;
	hasAnyProgress: boolean;
}

/* -------------------------------------------------------------------------- */
/*                             2. OFFLINE TRACKER                             */
/* -------------------------------------------------------------------------- */

/**
 * Stays alive at all times and notifies the OfflineProgressManager once a
 * player session transitions into or out of an "offline" state.
 */
export class OfflineTracker {
	private isOffline = false;
	private offlineStart = 0;
	private lastActive = Date.now();
	private hideTimestamp = 0;
	private pauseTimer?: ReturnType<typeof setTimeout>;

	constructor() {
		this.setupEventListeners();
	}

	/**
	 * Initializes startup check for offline rewards from previous session.
	 * Checks if enough time has passed since last save to warrant offline rewards.
	 */
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

	/* -------------------------- Event Registration ------------------------- */

	/**
	 * Sets up all browser and mobile event listeners for detecting when player goes offline.
	 * Includes visibility API, mobile pause/resume events, and beforeunload.
	 */
	private setupEventListeners() {
		document.addEventListener("visibilitychange", () => (document.hidden ? this.onTabHidden() : this.onTabVisible()));

		// Cordova / Capacitor emit these on mobile.
		document.addEventListener("pause", () => this.startOffline(OfflineReason.Visibility));
		document.addEventListener("resume", () => this.endOffline(OfflineReason.Visibility));

		// Browser window / tab about to close.
		window.addEventListener("beforeunload", () => this.startOffline(OfflineReason.BeforeUnload));
	}

	/* --------------------------- Visibility Logic -------------------------- */

	/**
	 * Handles tab becoming hidden. Starts a timer that will trigger offline mode
	 * after the configured threshold time.
	 */
	private onTabHidden() {
		this.hideTimestamp = Date.now();
		this.pauseTimer = setTimeout(() => this.startOffline(OfflineReason.Visibility), GAME_BALANCE.offline.offlineThreshold_MS);
	}

	/**
	 * Handles tab becoming visible again. Cancels pending offline timer if player
	 * returns quickly, or ends offline session if they were truly offline.
	 */
	private onTabVisible() {
		// 1) Player came back quickly → just cancel timer.
		if (this.pauseTimer) {
			clearTimeout(this.pauseTimer);
			this.pauseTimer = undefined;
		}
		// 2) …or they were truly gone → stop offline session & hand over to manager.
		if (this.isOffline) this.endOffline(OfflineReason.Visibility);
	}

	/* --------------------------- State Transitions ------------------------- */

	/**
	 * Begins offline session. Saves current time, pauses game systems,
	 * and marks the game as offline.
	 */
	private startOffline(reason: OfflineReason) {
		if (this.isOffline) return;
		this.isOffline = true;
		this.offlineStart = Date.now();
		this.saveCurrentTime();
		this.pauseGameSystems();
		printLog(`▶ Offline (${reason})`, 3, "OfflineTracker", "offline");
	}

	/**
	 * Ends offline session. Resumes game systems, calculates session duration,
	 * and triggers offline reward processing if player was gone long enough.
	 */
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

		// Only bother if player was actually away for 'offlineThreshold' or longer.
		if (session.duration >= GAME_BALANCE.offline.offlineThreshold_MS) this.handleOfflineSession(session);
		this.lastActive = now;
	}

	/* -------------------------- Helper Shortcuts -------------------------- */

	/**
	 * Pauses all active game systems by notifying the offline manager.
	 */
	private pauseGameSystems() {
		GameContext.getInstance().services.offlineManager.pauseActiveSystems();
	}

	/**
	 * Resumes all paused game systems by notifying the offline manager.
	 */
	private resumeGameSystems() {
		GameContext.getInstance().services.offlineManager.resumeActiveSystems();
	}

	/**
	 * Passes offline session to the manager for processing rewards.
	 */
	private handleOfflineSession(session: OfflineSession) {
		// Access through GameContext services instead of singleton
		GameContext.getInstance().services.offlineManager.processOfflineSession(session);
	}

	/**
	 * Gets the last saved timestamp from the game's save system.
	 */
	private getLastSaveTime() {
		return GameContext.getInstance().saves.getLastActiveTime();
	}

	/**
	 * Updates the last active time in the game's save system.
	 */
	private saveCurrentTime() {
		GameContext.getInstance().saves.updateLastActiveTime();
	}

	/* ----------------------------- Public API ----------------------------- */

	/**
	 * Returns milliseconds since the player was last active.
	 */
	public getTimeSinceLastActive() {
		return Date.now() - this.lastActive;
	}

	/**
	 * Returns whether the game is currently in offline mode.
	 */
	public isCurrentlyOffline() {
		return this.isOffline;
	}
}

/* -------------------------------------------------------------------------- */
/*                         3. OFFLINE PROGRESS MANAGER                        */
/* -------------------------------------------------------------------------- */

/**
 * Singleton that owns:
 *  - A registry of "sub‑system calculators".
 *  - The modal that shows rewards to the player.
 *
 * Add new idle systems by implementing `SystemOfflineCalculator` and calling
 * `registerCalculators` in the constructor.
 */
export class OfflineProgressManager {
	private readonly calculators = new Map<keyof OfflineProgressResult, SystemOfflineCalculator<unknown>>();
	private readonly tracker = new OfflineTracker();
	private systemsPaused = false;
	private initialized = false;

	private constructor() {
		this.registerCalculators();
	}

	/**
	 * Initialize the offline progress system after GameContext is ready.
	 * This should be called from GameApp after all core systems are initialized.
	 * NOTE: Method name has typo to match existing GameApp.ts call
	 */
	public initalize() {
		if (this.initialized) return;
		this.initialized = true;
		this.tracker.initializeStartupCheck();
	}

	/* ---------------------------- Registration ---------------------------- */

	/**
	 * Registers all subsystem calculators. Comment out any systems you haven't
	 * implemented yet to disable their offline progress.
	 */
	private registerCalculators() {
		this.calculators.set("hunt", new OfflineHuntCalculator());
		this.calculators.set("training", new OfflineTrainingCalculator());
		this.calculators.set("research", new OfflineResearchCalculator());
		// this.calculators.set("settlement", new OfflineSettlementCalculator());
	}

	/* -------------------------- Pause / Resume ---------------------------- */

	/**
	 * Pauses all active game systems and emits a pause event.
	 */
	public pauseActiveSystems() {
		this.systemsPaused = true;
		bus.emit("game:systemsPaused");
	}

	/**
	 * Resumes all paused game systems and emits a resume event.
	 */
	public resumeActiveSystems() {
		this.systemsPaused = false;
		bus.emit("game:systemsResumed");
	}

	/**
	 * Returns whether game systems are currently paused.
	 */
	public areSystemsPaused() {
		return this.systemsPaused;
	}

	/* ------------------------- Session Processing ------------------------ */

	/**
	 * Processes an offline session by calculating rewards for each subsystem
	 * and showing the results modal to the player.
	 */
	public processOfflineSession(session: OfflineSession) {
		const context = GameContext.getInstance();
		const results: OfflineProgressResult = {} as OfflineProgressResult;

		// Calculate rewards for each registered subsystem
		for (const [name, calc] of this.calculators) {
			try {
				// TS keeps type safety because `name` is keyof OfflineProgressResult
				// and we cast calc to the matching interface when retrieving.
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(results as any)[name] = calc.calculateOfflineProgress(session, context);
			} catch (err) {
				console.error(`⚠️ Error while calculating ${name}:`, err);
			}
		}

		this.showOfflineModal(session, results);
	}

	/**
	 * Creates and displays the offline progress modal with calculated rewards.
	 */
	private showOfflineModal(session: OfflineSession, results: OfflineProgressResult) {
		try {
			new OfflineProgressModal(session, results).show();
		} catch (err) {
			console.error("⚠️ Could not show OfflineProgressModal:", err);
		}
	}

	/**
	 * Applies all offline rewards when player confirms the modal.
	 * Called from UI after player clicks "Accept" on the modal.
	 */
	public applyOfflineRewards(results: OfflineProgressResult) {
		const context = GameContext.getInstance();

		// Apply rewards for each subsystem
		for (const [name, calc] of this.calculators) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const progress = (results as any)[name];
			if (progress) calc.applyOfflineProgress(progress, context);
		}

		context.saves.saveAll();
	}
}

/* -------------------------------------------------------------------------- */
/*                        4. SYSTEM‑SPECIFIC CALCULATORS                      */
/* -------------------------------------------------------------------------- */

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~ H U N T   S Y S T E M ~~~~~~~~~~~~~~~~~~~~~~~~ */

class OfflineHuntCalculator implements SystemOfflineCalculator<OfflineHuntProgress> {
	private readonly treasure = new OfflineTreasureCalculator();

	/**
	 * Calculates offline hunting progress including enemies killed, renown gained,
	 * experience earned, and treasure chests found.
	 */
	calculateOfflineProgress(session: OfflineSession, context: GameContext): OfflineHuntProgress {
		const area = context.currentRun?.huntManager.getActiveArea();
		if (!area) return this.emptyProgress(session.duration);

		const character = context.character;
		const offlineSeconds = session.duration / 1000;
		const avgKillTime = this.estimateKillTime(character, area);
		const efficiency = GAME_BALANCE.offline.defaultOfflineEfficieny;
		const kills = Math.floor((offlineSeconds / avgKillTime) * efficiency);

		const chests = this.treasure.calculateTreasureRewards(offlineSeconds);

		return {
			enemiesKilled: kills,
			renownGained: this.calcRenown(kills, area),
			experienceGained: new BigNumber(kills).multiply(area.getXpPerKill(false)),
			treasureChests: chests.chestsEarned,
			treasureBreakdown: chests.timeBreakdowns,
			nextChestIn: chests.nextChestIn,
			sessionDuration: session.duration,
			areaName: area.displayName,
			efficiency,
		};
	}

	/**
	 * Applies calculated hunting rewards to the game state.
	 */
	applyOfflineProgress(progress: OfflineHuntProgress, context: GameContext) {
		context.player.adjustRenown(progress.renownGained);
		context.character.gainXp(progress.experienceGained);

		if (progress.treasureChests > 0) {
			for (let i = 0; i < progress.treasureChests; i++) {
				context.inventory.addLootById("basic_treasure_chest");
			}
		}
	}

	/* ---------------------------- Helpers ---------------------------- */

	/**
	 * Calculates renown reward based on number of kills and area tier.
	 */
	private calcRenown(kills: number, area: Area) {
		return new BigNumber(kills * area.tier);
	}

	/**
	 * Estimates average time to kill an enemy. Currently uses a simple constant.
	 * TODO: Make this dynamic based on player stats vs enemy stats.
	 */
	private estimateKillTime(_: PlayerCharacter, __: Area) {
		return GAME_BALANCE.offline.offlineEstimatedKillTimeSec;
	}

	/**
	 * Returns an empty progress object when no area is active.
	 */
	private emptyProgress(duration: number): OfflineHuntProgress {
		return {
			enemiesKilled: 0,
			renownGained: new BigNumber(0),
			experienceGained: new BigNumber(0),
			treasureChests: 0,
			treasureBreakdown: [],
			nextChestIn: 30 * 60,
			sessionDuration: duration,
			areaName: "Unknown",
			efficiency: 0,
		};
	}
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~ R E S E A R C H   S Y S T E M ~~~~~~~~~~~~~~~~~~~~~~~~ */

// The Research Calculator
class OfflineResearchCalculator implements SystemOfflineCalculator<OfflineResearchProgress> {
	/**
	 * Calculates offline research progress for all active research.
	 * Simulates the tick behavior to determine what would complete.
	 */
	calculateOfflineProgress(session: OfflineSession, context: GameContext): OfflineResearchProgress {
		const library = context.library;
		if (!library) {
			return {
				researchCompleted: [],
				researchInProgress: [],
				totalCompleted: 0,
				hasAnyProgress: false,
				offlineSeconds: 0,
			};
		}

		const offlineSeconds = session.duration / 1000;
		const activeResearch = library.getActive();
		const speedMultiplier = GAME_BALANCE.research.baseResearchSpeedMultiplier || 1;

		const completed: OfflineResearchProgress["researchCompleted"] = [];
		const inProgress: OfflineResearchProgress["researchInProgress"] = [];

		// Calculate progress for each active research
		for (const research of activeResearch) {
			const startProgress = research.progress;
			const progressGain = offlineSeconds * speedMultiplier;
			const endProgress = startProgress + progressGain;
			const requiredTime = research.requiredTime;

			if (endProgress >= requiredTime) {
				// This research completed during offline
				completed.push({
					id: research.id,
					name: research.name,
					startProgress,
					endProgress: requiredTime,
					completed: true,
				});
			} else {
				// Still in progress
				inProgress.push({
					id: research.id,
					name: research.name,
					progressGained: progressGain,
					percentComplete: (endProgress / requiredTime) * 100,
				});
			}
		}

		return {
			researchCompleted: completed,
			researchInProgress: inProgress,
			totalCompleted: completed.length,
			hasAnyProgress: completed.length > 0 || inProgress.length > 0,
			offlineSeconds: offlineSeconds, // Pass along for apply phase
		};
	}

	/**
	 * Applies calculated research progress by calling tick with the offline duration.
	 * The LibraryManager's tick handler will automatically handle completion.
	 */
	applyOfflineProgress(progress: OfflineResearchProgress, context: GameContext) {
		const library = context.library;
		if (!library || !progress.hasAnyProgress) return;

		// Use the offline seconds we stored during calculation
		library.handleTick(progress.offlineSeconds);
	}
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~ T R A I N I N G   S Y S T E M ~~~~~~~~~~~~~~~~~~ */

class OfflineTrainingCalculator implements SystemOfflineCalculator<OfflineTrainingProgress> {
	/**
	 * Calculates training progress for all stats with assigned points.
	 * Progress is based on assigned points * offline time.
	 */
	calculateOfflineProgress(session: OfflineSession, context: GameContext): OfflineTrainingProgress {
		const trainedStats = context.currentRun?.trainedStats;
		if (!trainedStats) return { statsProgressed: {}, totalLevelsGained: 0, hasAnyProgress: false };

		const offlineSeconds = session.duration / 1000;
		const stats: OfflineTrainingProgress["statsProgressed"] = {};
		let total = 0;

		// Calculate progress for each stat with assigned points
		for (const [id, stat] of trainedStats.stats) {
			if (!stat.assignedPoints) continue;

			// Calculate potential progress: assignedPoints * seconds
			const potentialProgress = stat.assignedPoints * offlineSeconds;

			// Level threshold is the stat's maxAssigned value (e.g., 60 for basic stats)
			const levelThreshold = stat.getLevelThreshold();
			const levels = Math.floor(potentialProgress / levelThreshold);

			stats[id] = {
				offlineSeconds,
				estimatedLevels: levels,
				startLevel: stat.level,
				endLevel: stat.level + levels,
				statName: stat.name,
			};
			total += levels;
		}

		return { statsProgressed: stats, totalLevelsGained: total, hasAnyProgress: total > 0 };
	}

	/**
	 * Applies training progress by calling handleTick with the offline duration.
	 * The TrainedStat class handles the actual leveling logic.
	 */
	applyOfflineProgress(progress: OfflineTrainingProgress, context: GameContext) {
		const trainedStats = context.currentRun?.trainedStats;
		if (!trainedStats) return;

		// Apply progress to each stat that had offline gains
		for (const [id, info] of Object.entries(progress.statsProgressed)) {
			const stat = trainedStats.stats.get(id);
			if (stat && info.offlineSeconds > 0) {
				// Let the TrainedStat handle the tick naturally
				stat.handleTick(info.offlineSeconds);
			}
		}
	}
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~ S E T T L E M E N T   S Y S T E M ~~~~~~~~~~~~~~ */

/**
 * Stub calculator for settlement system. Enable once mines, research, etc. are implemented.
 */
class OfflineSettlementCalculator implements SystemOfflineCalculator<OfflineSettlementProgress> {
	/**
	 * Calculates offline settlement progress. Currently returns empty progress.
	 * TODO: Implement resource generation, building completion, research progress, etc.
	 */
	calculateOfflineProgress(): OfflineSettlementProgress {
		return {
			resourcesGenerated: {},
			buildingsCompleted: [],
			researchProgress: {},
			miningProgress: {},
			hasAnyProgress: false,
		};
	}

	/**
	 * Applies settlement progress. Currently does nothing.
	 * TODO: Apply resource gains, complete buildings, advance research, etc.
	 */
	applyOfflineProgress(): void {
		/* TODO: Implement when settlement systems are ready */
	}
}

/* -------------------------------------------------------------------------- */
/*            5. UTILITY: TREASURE CHEST REWARD CALC (ESCALATING)             */
/* -------------------------------------------------------------------------- */

class OfflineTreasureCalculator {
	private readonly intervals = GAME_BALANCE.offline.chestIntervalsSec;

	/**
	 * Calculates treasure chest rewards using an escalating interval system.
	 * First chest at 30m, second at 1h, third at 2h, etc., then every 8h after.
	 */
	calculateTreasureRewards(offlineSeconds: number): OfflineTreasureReward {
		let time = offlineSeconds;
		let earned = 0;
		const breakdown: OfflineTreasureReward["timeBreakdowns"] = [];

		// Escalating Intervals: 30m, 1h, 2h, 4h, then every 8h.
		for (let i = 0; i < this.intervals.length && time >= this.intervals[i]; i++) {
			time -= this.intervals[i];
			earned++;
			breakdown.push({ interval: this.fmt(this.intervals[i]), chestsFromInterval: 1 });
		}

		// After all escalating intervals, use the longest interval repeatedly
		if (time > 0) {
			const long = this.intervals.at(-1)!;
			const extra = Math.floor(time / long);
			if (extra) {
				earned += extra;
				breakdown.push({
					interval: `${this.fmt(long)} ×${extra}`,
					chestsFromInterval: extra,
				});
				time -= extra * long;
			}
		}

		// Calculate time until next chest
		const nextIn = (breakdown.length < this.intervals.length ? this.intervals[breakdown.length] : this.intervals.at(-1)!) - time;

		return { chestsEarned: earned, timeBreakdowns: breakdown, nextChestIn: nextIn };
	}

	/**
	 * Formats seconds into a human-readable time string (e.g., "2h" or "30m").
	 */
	private fmt(sec: number) {
		const h = Math.floor(sec / 3600);
		const m = Math.floor((sec % 3600) / 60);
		return h ? `${h}h` : `${m}m`;
	}
}
