import { Bounded } from "../domain/value-objects/Bounded";
import { BaseCharacter } from "./BaseCharacter";
import { CharacterData } from "../types/character";
import { Monster } from "@/models/Monster";

export class EnemyCharacter extends BaseCharacter {


    public readonly spec: Monster;

    constructor(spec: Monster){
        const data: CharacterData = {
            name: spec.displayName,
            level: 1,
            health: new Bounded(0, spec.baseStats.hp, spec.baseStats.hp),
            CharacterStats: {
                strength: spec.baseStats.attack,
                defence: spec.baseStats.defense,
            },
    }
    super(data)
    this.spec = spec
    }
}