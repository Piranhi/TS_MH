import { BaseCharacter } from "./BaseCharacter";
import { Monster } from "@/models/Monster";
import { debugManager } from "@/core/DebugManager";
import { GAME_BALANCE } from "@/balance/GameBalance";

export class EnemyCharacter extends BaseCharacter {
    public readonly spec: Monster;

    constructor(spec: Monster) {
        super(
            spec.displayName,
            {
                // Scaled by area
                get: (statKey) => spec.areaScaledStats[statKey],
            },
            spec.abilities,
            spec.statusModifiers,
        );
        // Add default abilities
        for (const abilityId of spec.abilities) {
            this.addNewAbility(abilityId);
        }

        this.spec = spec;
        this._type = "ENEMY";
        this.stamina.setMax(GAME_BALANCE.player.stamina.enemyMax);
        this.stamina.setCurrent(GAME_BALANCE.player.stamina.enemyMax);

        // Debug Options
        this.canAttack = debugManager.get("enemy_canAttack");
        this.canTakeDamage = debugManager.get("enemy_canTakeDamage");
        this.canDie = debugManager.get("enemy_canDie");
    }

    override getAvatarUrl(): string {
        return this.spec.imgUrl;
    }
}
