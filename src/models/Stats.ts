import { Bounded } from "./value-objects/Bounded";

export interface CoreStats {
    attack: number;
    defence: number;
    speed: number;
    maxHp: number;
}

/** Extra stats that only the player uses */
export interface PlayerExtras {
    critChance: number;
    critDamage: number;
    lifesteal: number;
    // add more as the design grows
}

export type PlayerStats = CoreStats & PlayerExtras;

export type StatsModifier<S extends CoreStats = CoreStats> = Partial<Record<keyof S, number>>;
