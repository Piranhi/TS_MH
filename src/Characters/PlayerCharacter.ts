import { CharacterStatsMap, setupInitialStats } from "../types/character";
import { BaseCharacter } from "./BaseCharacter";

export class PlayerCharacter extends BaseCharacter {

    charName = "Chris";
    stats = setupInitialStats({
        health: 100,
        strength: 100,
        defence: 15
    })


    init(): void{

    };
}