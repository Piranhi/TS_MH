import { Bounded } from "../domain/value-objects/Bounded";
import { BaseCharacter } from "./BaseCharacter";
import { CharacterData } from "../types/character";

export class PlayerCharacter extends BaseCharacter {
    

    static createNewPlayer(): PlayerCharacter{
        const data: CharacterData = {
            name: "Player",
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