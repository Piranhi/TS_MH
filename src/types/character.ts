import { Bounded } from "../domain/value-objects/Bounded";

type StatKey = "strength" | "defence";

export interface CharacterData {
    name: string;
    level: number;
    hp: Bounded;
    CharacterStats: CharacterStatsMap;
}

export type CharacterStatsMap = Record<StatKey, number>;

export type StatInit = Record<StatKey, number>;

export function setupInitialStats(init: StatInit): CharacterStatsMap {
    const stats = {} as CharacterStatsMap;
    (Object.keys(init) as StatKey[]).forEach((key) => {
        const value = init[key];
        stats[key] = value;
    });

    return stats;
}
