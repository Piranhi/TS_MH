import { Bounded } from "./value-objects/Bounded";
import { BaseCharacter } from "./BaseCharacter";
import { Monster as MonsterJSON } from "@/models/Monster";
import { CoreStats } from "./Stats";

export class EnemyCharacter extends BaseCharacter {
    public readonly spec: MonsterJSON;

    constructor(spec: MonsterJSON) {
        const stats: CoreStats = {
            attack: spec.baseStats.attack,
            defence: spec.baseStats.defence,
            speed: spec.baseStats.speed,
            maxHp: spec.baseStats.hp,
        };
        super({
            name: spec.displayName,
            level: 1,
            hp: new Bounded(0, stats.maxHp, stats.maxHp),
            stats,
        });
        this.spec = spec;
    }
}
