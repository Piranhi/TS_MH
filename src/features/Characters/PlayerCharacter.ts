import { Bounded } from "../../domain/value-objects/Bounded";
import { BaseCharacter, CharacterStats, CharacterData } from "./BaseCharacter";

export class PlayerCharacter extends BaseCharacter {


    protected getAvatarUrl(): string{
        return "/assets/avatars/player.png";
    }
    
    static createNewPlayer(): PlayerCharacter {
        const defaultStats: CharacterStats = {
            strength: 2,
            defence: 2,
            attackBase: 1,
            attackMulti: 1,
        }

        const data: CharacterData = {
            name: "You",
            level: 1,
            hp: new Bounded(0, 100, 100),
            stats: defaultStats
        }

        return new PlayerCharacter(data);
    }
}
