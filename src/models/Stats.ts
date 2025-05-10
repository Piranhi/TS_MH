export interface CoreStats {
    attack: number;
    defence: number;
    speed: number;
    maxHp: number;
}

/** Extra stats that only the player uses */
export interface PlayerExtras {
    attackFlat: number;
    defenceFlat: number;
    critChance: number;
    critDamage: number;
    lifesteal: number;
    // add more as the design grows
}

export type PlayerStats = CoreStats & PlayerExtras;

export type StatsModifier = Partial<PlayerStats>;

export const defaultCoreStats: CoreStats = {
    attack: 1,
    defence: 1,
    speed: 1,
    maxHp: 10,
}
