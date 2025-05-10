import { Bounded } from "./value-objects/Bounded";
import { BaseCharacter } from "./BaseCharacter";
import { PlayerStats } from "./Stats";

export class PlayerCharacter extends BaseCharacter<PlayerStats> {
    static createNew(): PlayerCharacter {
        const stats: PlayerStats = {
            attack: 2,
            defence: 2,
            speed: 1,
            maxHp: 100,
            critChance: 0.05,
            critDamage: 0.5,
            lifesteal: 0,
        };
        return new PlayerCharacter({
            name: "You",
            level: 1,
            hp: new Bounded(0, 100, 100),
            stats,
        });
    }

    protected getAvatarUrl(): string {
        return "/assets/avatars/player.png";
    }
}
