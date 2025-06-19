
export interface UserStats {
    level: number;
    prestiges: number;
    renownGained: number;
    renownSpent: number;
}

export interface AreaStats {
    areaUnlocked: boolean;
    outpostAvailable: boolean;
    outpostBuilt: boolean;
    killsTotal: number;
    killsThisRun: number;
    bossUnlockedEver: boolean;
    bossUnlockedThisRun: boolean;
    bossKilledThisRun: boolean;
    bossKillsTotal: number;
}

export interface EnemyStats {
    killsTotal: number;
    killsThisRun: number;
}

export interface OutpostStats {}

export interface PrestigeStats {}

export interface PrestigeState {
    runsCompleted: number;
    totalMetaPoints: number;
    permanentAttack: number;
    permanentDefence: number;
    permanentHP: number;
}

export interface GameStats {
    playTimeTotal: number;
    playTimeRun: number;
}

// ----------- DEFAULT STATS -----------------

export const DEFAULT_USER_STATS: UserStats = {
    level: 1,
    prestiges: 0,
    renownGained: 0,
    renownSpent: 0,
};

export const DEFAULT_ENEMY_STATS: EnemyStats = {
    killsTotal: 0,
    killsThisRun: 0,
};

export const DEFAULT_GAME_STATS: GameStats = {
    playTimeTotal: 0,
    playTimeRun: 0,
};

export const DEFAULT_PRESTIGE_STATS: PrestigeStats = {};

export const DEFAULT_OUTPOST_STATS: OutpostStats = {};

export const DEFAULT_AREA_STATS: AreaStats = {
    areaUnlocked: false,
    outpostAvailable: false,
    outpostBuilt: false,
    killsTotal: 0,
    killsThisRun: 0,
    bossUnlockedEver: false,
    bossUnlockedThisRun: false,
    bossKilledThisRun: false,
    bossKillsTotal: 0,
};
