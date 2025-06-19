import { printLog } from "@/core/DebugManager";
import { BaseCharacter } from "@/models/BaseCharacter";
import { EffectInstance, EffectResult } from "@/shared/types";

export class EffectProcessor {
    constructor(private readonly defenceConstant = 100) {}

    public apply(effect: EffectInstance, target: BaseCharacter): EffectResult {
        let outcomeValue = 0;

        switch (effect.type) {
            case "physical":
                outcomeValue = this.applyDamage(effect.rawValue, target);
                break;
            case "magical":
                console.log("TODO - ADD MAGICAL DAMAGE");
                break;
            case "heal":
                outcomeValue = this.applyHeal(effect.rawValue, target);
                break;
            case "buff":
                console.log("TODO - ADD BUFF");
                break;
            case "debuff":
                console.log("TODO - ADD DEBUFF");
                break;
            default:
                throw new Error(`Unknown effect type ${effect.type}`);
        }

        return {
            source: effect.source,
            target,
            effect,
            outcomeValue,
        };
    }

    private applyDamage(rawDamage: number, target: BaseCharacter): number {
        if (!target.canTakeDamage) return 0;
        const totalDefence = target.stats.get("defence") * (1 + target.stats.get("guard") / 100);

        const mitigationFactor = 1 - totalDefence / (totalDefence + this.defenceConstant);

        const finalDamage = Math.max(0, rawDamage * mitigationFactor);
        target.hp.decrease(finalDamage);
        printLog(`${target.name} taking damage. Inc: [RAW]${rawDamage} - [DEF]${totalDefence}, [MIT]${mitigationFactor - 1}  - [NET]${finalDamage}`, 3, "EffectProcessor.ts", "combat");
        // Debug invincible
        if (!target.canDie) {
            target.setToMaxHP();
        }

        return finalDamage;
    }

    private applyHeal(rawHealPercent: number, target: BaseCharacter): number {
        const healAmount = target.maxHp * (rawHealPercent / 100);
        if (healAmount <= 0) return 0;
        target.hp.increase(healAmount);
        printLog(`${target.name} healing. Inc: [RAW]${rawHealPercent}- [NET]${healAmount}}`, 3, "EffectProcessor.ts", "combat");
        return healAmount;
    }

    private applyBuff(effect: EffectInstance, target: BaseCharacter): number {
        // e.g. add to a BuffManager that tracks duration & statKey
        //BuffManager.addTemporaryBuff(target, effect.statKey!, effect.rawValue, effect.durationSeconds!);
        return 0;
    }
}
