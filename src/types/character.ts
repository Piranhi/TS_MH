import { Bounded } from "../domain/value-objects/Bounded";

type StatKey = "health" | "strength" | "defence";



export interface CharacterStats {
    health: Bounded;
    strengh: Bounded;
    defence: Bounded;
}

export type CharacterStatsMap = Record<StatKey, Bounded>;

export type StatInit = Record<StatKey, number>;

export function setupInitialStats(init: StatInit): CharacterStatsMap{
    const stats = {} as CharacterStatsMap;

    (Object.keys(init) as StatKey[]).forEach((key) => {
        const value = init[key];
        stats[key] = {
            min:        0,
            max:        value,
            current:    value,
        };
    });

    return stats;
}