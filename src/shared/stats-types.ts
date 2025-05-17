export interface AreaStats {
    killsTotal: number;
    killsThisRun: number;
    bossUnlockedEver: boolean;
    bossUnlockedThisRun: boolean;
    bossKilledThisRun: boolean;
    bossKillsTotal: number;
    bossKillsThisRun: number;
}

export const DEFAULT_AREA_STATS: AreaStats = {
    killsTotal: 0,
    killsThisRun: 0,
    bossUnlockedEver: false,
    bossUnlockedThisRun: false,
    bossKilledThisRun: false,
    bossKillsTotal: 0,
    bossKillsThisRun: 0,
};

export interface OutpostStats {}

export interface PrestigeStats {}
