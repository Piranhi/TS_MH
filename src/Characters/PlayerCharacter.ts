import { Bounded } from "../domain/value-objects/Bounded";
import { BaseCharacter } from "./BaseCharacter";
import { CharacterData } from "../types/character";

export class PlayerCharacter extends BaseCharacter {
    static createNewPlayer(): PlayerCharacter {
        return new PlayerCharacter({
            name: "You",
            level: 1,
            hp: new Bounded(0, 100, 100),
            CharacterStats: {
                strength: 1,
                defence: 1,
            },
        });
    }
}
