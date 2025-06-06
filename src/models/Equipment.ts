import { EquipmentItemSpec, InventoryItemState, UpgradableItem } from "@/shared/types";
import { SpecRegistryBase } from "./SpecRegistryBase";
import { UpgradeCalculator } from "./UpgradeCalculator";
import { bus } from "@/core/EventBus";
import { StatsModifier } from "./Stats";
import { scaleStatsModifier } from "@/shared/utils/stat-utils";

export class Equipment extends SpecRegistryBase<EquipmentItemSpec> implements EquipmentItemSpec, UpgradableItem {
    readonly category = "equipment";

    private constructor(private readonly spec: EquipmentItemSpec, private state: InventoryItemState) {
        super();
    }

    get id() {
        return this.state.specId;
    }
    get name() {
        return this.spec.name;
    }
    get iconUrl() {
        return this.spec.iconUrl;
    }
    get rarity() {
        return this.state.rarity;
    }
    get level() {
        return this.state.level ?? 1;
    }
    get quantity() {
        return 1;
    }

    get description() {
        return this.spec.description;
    }

    get equipType() {
        return this.spec.equipType;
    }

    get statMod() {
        return this.spec.statMod;
    }

    /**
     * Stat bonuses after applying rarity multiplier
     */
    public getBonuses(): StatsModifier {
        return scaleStatsModifier(this.spec.statMod, this.rarity ?? "common");
    }

    toJSON() {
        return {
            __type: "Equipment",
            spec: this.spec.id,
            state: this.state,
        };
    }

    static fromJSON(raw: any) {
        const spec = this.specById.get(raw.spec);
        if (!spec) throw new Error(`Unknown equipment "${raw.spec}"`);
        return new Equipment(spec, raw.state);
    }

    public static override specById = new Map<string, EquipmentItemSpec>();

    static createFromState(state: InventoryItemState): Equipment {
        const spec = this.specById.get(state.specId);
        if (!spec) throw new Error(`Unknown card "${state.specId}"`);
        return new Equipment(spec, state);
    }

    // Inside Equipment.ts
    addLevels(amount: number): void {
        const result = UpgradeCalculator.calculate(this.level, this.rarity!, amount);
        this.state.level = result.newLevel;
        this.state.rarity = result.newRarity;

        if (result.upgradedRarity) {
            // Could emit an event, show particles, etc.
            bus.emit("item:rarityUpgraded", { item: this, newRarity: result.newRarity });
        }
    }
}
