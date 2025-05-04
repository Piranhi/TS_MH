import { Bounded } from "../domain/value-objects/Bounded";
import { BaseCharacter } from "./BaseCharacter";
import { CharacterData } from "../types/character";

export class EnemyCharacter extends BaseCharacter {

    static createNewEnemy(name: string): EnemyCharacter{
        const data: CharacterData = {
            name,
            level: 1,
            health: new Bounded(0, 100, 100),
            CharacterStats: {
                strength: 1,
                defence: 1,
            },
        }
        return super.createNew(data);
    }


}