import { Bounded } from "./value-objects/Bounded";
import { BaseCharacter } from "./BaseCharacter";
import { Monster } from "@/models/Monster";

export class EnemyCharacter extends BaseCharacter {
    public readonly spec: Monster;

    constructor(spec: Monster) {
        super({
            name: spec.displayName,
            level: 1,
            hp: new Bounded(0, spec.baseStats.hp, spec.baseStats.hp),
            stats: {
                strength: spec.baseStats.attack,
                defence: spec.baseStats.defense,
            },
        });
        this.spec = spec;
    }
}
