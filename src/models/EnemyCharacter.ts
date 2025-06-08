import { BaseCharacter } from "./BaseCharacter";
import { Monster } from "@/models/Monster";
import { debugManager } from "@/core/DebugManager";

export class EnemyCharacter extends BaseCharacter {
    public readonly spec: Monster;

    constructor(spec: Monster) {
        super(spec.displayName, {
            // Scaled by area
            get: (statKey) => spec.areaScaledStats[statKey],
        });
        const defaultAbilities = spec.abilities ?? ["basic_melee"];
        this.updateAbilities(defaultAbilities);
        this.spec = spec;

        // Debug Options
        this.canAttack = debugManager.get("enemy_canAttack");
        this.canTakeDamage = debugManager.get("enemy_canTakeDamage");
        this.canDie = debugManager.get("enemy_canDie");
    }

    override getAvatarUrl(): string {
        return this.spec.imgUrl;
    }
}
