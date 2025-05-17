import { bus } from "@/core/EventBus";
import { saveManager } from "@/core/SaveManager";
import { AreaStats, DEFAULT_AREA_STATS, OutpostStats, PrestigeStats } from "@/shared/stats-types";
import { Saveable } from "@/shared/storage-types";

interface StatsManagerSaveState {
    areaStats: [string, AreaStats][];
}
export class StatsManager implements Saveable {
    private static _instance: StatsManager;

    private areaStats = new Map<string, AreaStats>();
    //private outpostStats = new Map<string, OutpostStats>();
    //private playerStats = new Map<string, PlayerStats>();
    //private prestigeStats: PrestigeStats;

    private constructor() {
        this.setupListeners();
        saveManager.register("StatsManager", this);
    }

    private setupListeners() {
        bus.on("hunt:areaKill", ({ enemyId, areaId }) => {
            this.areaKill(enemyId, areaId);
        });
    }

    getAreaStats(areaId: string): AreaStats {
        if (!this.areaStats.has(areaId)) {
            this.setAreaStats(areaId, { ...DEFAULT_AREA_STATS });
        }
        return this.areaStats.get(areaId)!;
    }

    setAreaStats(areaId: string, stats: AreaStats) {
        this.areaStats.set(areaId, stats);
        bus.emit("hunt:statsChanged", stats);
    }

    private areaKill(enemyId: string, areaId: string) {
        const areaStats = this.getAreaStats(areaId);
        if (!areaStats) return;
        areaStats.killsThisRun++;
        areaStats.killsTotal++;
        if (areaStats.killsThisRun >= 10) {
            areaStats.bossUnlockedThisRun = true;
            areaStats.bossUnlockedEver = false;
        }
        this.setAreaStats(areaId, areaStats);
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
        };
    }

    load(state: StatsManagerSaveState): void {
        this.areaStats = new Map(state.areaStats);
    }
}
