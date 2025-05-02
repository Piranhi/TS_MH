import { CharacterStatsMap } from "../types/character";

export abstract class BaseCharacter{
    abstract readonly charName: string;
    abstract stats: CharacterStatsMap;
    

    abstract init(): void;
}