import { printLog } from "@/core/DebugManager";
import { BaseCharacter } from "@/models/BaseCharacter";
import { BigNumber } from "@/models/utils/BigNumber";
import { EffectInstance, EffectResult } from "@/shared/types";

export class EffectProcessor {
    constructor(private readonly defenceConstant = 100) {}

    public apply(effect: EffectInstance, target: BaseCharacter): EffectResult {
        let outcomeValue: BigNumber = new BigNumber(0);

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

    private applyDamage(rawDamage: BigNumber, target: BaseCharacter): BigNumber {
        if (!target.canTakeDamage) return new BigNumber(0);
        const totalDefence = target.stats.get("defence") * (1 + target.stats.get("guard") / 100);

        const mitigationFactor = 1 - totalDefence / (totalDefence + this.defenceConstant);

        const finalDamage = rawDamage.multiply(mitigationFactor).clampMinZero();
        target.hp.decrease(finalDamage);
        printLog(`${target.name} taking damage. Inc: [RAW]${rawDamage.toString()} - [DEF]${totalDefence}, [MIT]${mitigationFactor - 1}  - [NET]${finalDamage.toString()}`, 3, "EffectProcessor.ts", "combat");
        // Debug invincible
        if (!target.canDie) {
            target.setToMaxHP();
        }

        return finalDamage;
    }

    private applyHeal(rawHealPercent: BigNumber, target: BaseCharacter): BigNumber {
        const healAmount = target.maxHp.multiply(rawHealPercent.div(100));
        if (healAmount.lte(new BigNumber(0))) return new BigNumber(0);
        target.hp.increase(healAmount);
        printLog(`${target.name} healing. Inc: [RAW]${rawHealPercent.toString()}- [NET]${healAmount.toString()}}`, 3, "EffectProcessor.ts", "combat");
        return healAmount;
    }

    private applyBuff(effect: EffectInstance, target: BaseCharacter): number {
        // e.g. add to a BuffManager that tracks duration & statKey
        //BuffManager.addTemporaryBuff(target, effect.statKey!, effect.rawValue, effect.durationSeconds!);
        return 0;
    }
}
