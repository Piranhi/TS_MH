import { bus } from "@/core/EventBus";
import { Saveable } from "@/shared/storage-types";
import {
	AreaStats,
	DEFAULT_AREA_STATS,
	DEFAULT_ENEMY_STATS,
	DEFAULT_GAME_STATS,
	DEFAULT_PRESTIGE_STATS,
	DEFAULT_USER_STATS,
	EnemyStats,
	GameStats,
	PrestigeStats,
	UserStats,
} from "@/shared/stats-types";
import { GAME_BALANCE } from "@/balance/GameBalance";

interface StatsManagerSaveState {
	areaStats: [string, AreaStats][];
	userStats: UserStats;
	prestigeStats: PrestigeStats;
	gameStats: GameStats;
	enemyStats: [string, EnemyStats][];
}
export class StatsManager implements Saveable {
	private static _instance: StatsManager;

	private userStats: UserStats;
	private prestigeStats: PrestigeStats;
	private gameStats: GameStats;
	private areaStats = new Map<string, AreaStats>();
	private enemyStats = new Map<string, EnemyStats>();

	private constructor() {
		this.userStats = { ...DEFAULT_USER_STATS };
		this.prestigeStats = { ...DEFAULT_PRESTIGE_STATS };
		this.gameStats = { ...DEFAULT_GAME_STATS };
		this.setupListeners();
	}

	private setupListeners() {
		bus.on("hunt:areaKill", ({ enemyId, areaId }) => {
			this.areaKill(enemyId, areaId);
		});
		bus.on("player:level-up", () => {
			this.playerLevelup();
		});
		bus.on("hunt:bossKill", ({ areaId }) => this.bossKill(areaId));
		//bus.on("hunt:areaChanged", (area) => this.setAreaStats(area.id, this.getAreaStats(area.id)));
		bus.on("game:prestigePrep", () => this.prestigeInit());
		bus.on("outpost:available", ({ areaId }) => this.markOutpostAvailable(areaId));
		bus.on("outpost:built", ({ areaId }) => this.markOutpostBuilt(areaId));
	}

	// ------------------ SETTERS -----------------------

	setAreaStats(areaId: string, stats: AreaStats) {
		this.areaStats.set(areaId, stats);
		bus.emit("stats:areaStatsChanged", stats);
	}

	setUserStats(stats: UserStats) {
		this.userStats = stats;
		bus.emit("stats:userStatsChanged", stats);
	}

	setEnemyStats(enemyId: string, stats: EnemyStats) {
		this.enemyStats.set(enemyId, stats);
		bus.emit("stats:enemyStatsChanged", stats);
	}

	setGameStats(stats: GameStats) {
		this.gameStats = stats;
		bus.emit("stats:gameStatsChanged", stats);
	}

	setPrestigeStats(stats: PrestigeStats) {
		this.prestigeStats = stats;
		bus.emit("stats:prestigeStatsChanged", stats);
	}

	// ----------------- GETTERS ----------------------
	getUserStats(): UserStats {
		if (!this.userStats) {
			this.userStats = { ...DEFAULT_USER_STATS };
		}
		return this.userStats;
	}
	getGameStats(): GameStats {
		if (!this.gameStats) {
			this.gameStats = { ...DEFAULT_GAME_STATS };
		}
		return this.gameStats;
	}
	getPrestigeStats(): PrestigeStats {
		if (!this.prestigeStats) {
			this.prestigeStats = { ...DEFAULT_PRESTIGE_STATS };
		}
		return this.prestigeStats;
	}
	getAreaStats(areaId: string): AreaStats {
		if (!this.areaStats.has(areaId)) {
			this.setAreaStats(areaId, { ...DEFAULT_AREA_STATS });
		}
		return this.areaStats.get(areaId)!;
	}

	getEnemyStats(enemyId: string): EnemyStats {
		if (!this.enemyStats.has(enemyId)) {
			this.setEnemyStats(enemyId, { ...DEFAULT_ENEMY_STATS });
		}
		return this.enemyStats.get(enemyId)!;
	}

	// --------------- STAT MODIFICATION METHODS -----------------------

	private prestigeInit() {
		if (this.areaStats.size === 0 && this.enemyStats.size === 0) return;
		// Reset area specific run counters
		for (const [areaId, stats] of this.areaStats) {
			stats.bossKilledThisRun = false;
			stats.bossUnlockedThisRun = false;
			stats.killsThisRun = 0;
			this.setAreaStats(areaId, stats);
		}

		// Reset enemy specific run counters
		for (const [enemyId, eStats] of this.enemyStats) {
			eStats.killsThisRun = 0;
			this.setEnemyStats(enemyId, eStats);
		}
	}

	private areaKill(enemyId: string, areaId: string) {
		// Update area-level stats
		const areaStats = this.getAreaStats(areaId);
		areaStats.killsThisRun++;
		areaStats.killsTotal++;
		if (areaStats.killsThisRun >= GAME_BALANCE.hunt.enemiesNeededForBoss) {
			areaStats.bossUnlockedThisRun = true;
			areaStats.bossUnlockedEver = true;
		}
		this.setAreaStats(areaId, areaStats);

		// Update enemy-level stats
		const enemyStats = this.getEnemyStats(enemyId);
		enemyStats.killsThisRun++;
		enemyStats.killsTotal++;
		this.setEnemyStats(enemyId, enemyStats);
	}

	public unlockArea(areaId: string) {
		const areaStats = this.getAreaStats(areaId);
		if (!areaStats) return;
		if (areaStats.areaUnlocked) return; // Already unlocked
		areaStats.areaUnlocked = true;
		this.setAreaStats(areaId, areaStats);
		bus.emit("hunt:areaUnlocked", areaId);
	}

	private bossKill(areaId: string) {
		const areaStats = this.getAreaStats(areaId);
		if (!areaStats) return;
		areaStats.bossKilledThisRun = true;
		areaStats.bossKillsTotal++;
		this.setAreaStats(areaId, areaStats);
	}

	private playerLevelup() {
		const stats = this.getUserStats();
		stats.level++;
		this.setUserStats(stats);
	}

	// ----- Outpost helpers -----
	private markOutpostAvailable(areaId: string) {
		const stats = this.getAreaStats(areaId);
		stats.outpostAvailable = true;
		this.setAreaStats(areaId, stats);
	}

	private markOutpostBuilt(areaId: string) {
		const stats = this.getAreaStats(areaId);
		stats.outpostBuilt = true;
		stats.outpostAvailable = false;
		this.setAreaStats(areaId, stats);
	}

	public isOutpostBuilt(areaId: string): boolean {
		return this.getAreaStats(areaId).outpostBuilt ?? false;
	}

	public isOutpostAvailable(areaId: string): boolean {
		return this.getAreaStats(areaId).outpostAvailable ?? false;
	}

	static get instance(): StatsManager {
		if (!StatsManager._instance) {
			StatsManager._instance = new StatsManager();
		}
		return StatsManager._instance;
	}

	save(): StatsManagerSaveState {
		return {
			areaStats: Array.from(this.areaStats.entries()),
			userStats: this.userStats,
			prestigeStats: this.prestigeStats,
			gameStats: this.gameStats,
			enemyStats: Array.from(this.enemyStats.entries()),
		};
	}

	load(state: StatsManagerSaveState): void {
		this.areaStats = new Map(state.areaStats);
		this.userStats = state.userStats || { ...DEFAULT_USER_STATS };
		this.prestigeStats = state.prestigeStats || { ...DEFAULT_PRESTIGE_STATS };
		this.gameStats = state.gameStats || { ...DEFAULT_GAME_STATS };
		this.enemyStats = new Map(state.enemyStats || []);
	}

	// ----------------- DEBUG METHODS ----------------------
	public debugUnlockBoss(areaId: string) {
		const areaStats = this.getAreaStats(areaId);
		if (!areaStats) return;
		areaStats.bossUnlockedThisRun = true;
		this.setAreaStats(areaId, areaStats);
	}
}
