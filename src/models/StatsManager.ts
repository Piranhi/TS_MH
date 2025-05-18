import { bus } from "@/core/EventBus";
import { saveManager } from "@/core/SaveManager";
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
	OutpostStats,
	PrestigeStats,
	UserStats,
} from "@/shared/stats-types";

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
	private outpostStats = new Map<string, OutpostStats>();

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

	private areaKill(enemyId: string, areaId: string) {
		const areaStats = this.getAreaStats(areaId);
		if (!areaStats) return;
		areaStats.killsThisRun++;
		areaStats.killsTotal++;
		if (areaStats.killsThisRun >= 10) {
			areaStats.bossUnlockedThisRun = true;
			areaStats.bossUnlockedEver = true;
		}
		this.setAreaStats(areaId, areaStats);
	}

	private playerLevelup() {
		const stats = this.getUserStats();
		stats.level++;
		this.setUserStats(stats);
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
}
