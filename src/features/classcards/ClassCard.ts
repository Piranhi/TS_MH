import { bus } from "@/core/EventBus";
import { StatsModifier } from "@/models/Stats";
import { ClassCardItem, InventoryItem, ItemCategory, ItemEquipStatus, ItemRarity } from "@/shared/types";

// Import data
export interface CardSpec {
    id: string;
    name: string;
    description: string;
    iconUrl: string;
    rarity: ItemRarity;
    statMod: StatsModifier;
    baseGainRate: number;
}

// Instance data
export interface CardState {
    specId: string;
    status: ItemEquipStatus;
    level: number;
    progress: number;
}

export class ClassCard implements ClassCardItem {
    // Registry
    private static specById = new Map<string, CardSpec>();
    static registerSpecs(specs: CardSpec[]) {
        specs.forEach((s) => this.specById.set(s.id, s));
    }
    // Build a brand new card with default state;
    static create(id: string): ClassCard {
        const spec = this.specById.get(id);
        if (!spec) throw new Error(`Unknown card "${id}"`);

        const defaultState: CardState = {
            specId: spec.id,
            status: "Unequipped",
            level: 1,
            progress: 0,
        };
        return new ClassCard(spec, defaultState);
    }

    // Rehydrate from a previous saved JSON state
    static fromState(state: CardState): ClassCard {
        const spec = this.specById.get(state.specId);
        if (!spec) throw new Error(`Unknown card "${state.specId}"`);
        return new ClassCard(spec, state);
    }

    private spec: CardSpec;
    private state: CardState;
    readonly category = "classCard";

    /** always private—use the factories below instead */
    private constructor(spec: CardSpec, state: CardState) {
        this.spec = spec;
        this.state = state;
    }

    public init() {}

    public equip() {
        this.state.status = "Equipped";
    }

    public unequip() {
        this.state.status = "Unequipped";
    }

    public gainExp(monsterExp: number = 1) {
        const gain = this.spec.baseGainRate * monsterExp;
        this.state.progress += gain;
        if (this.state.progress >= this.nextThreshold()) {
            this.levelUp();
        }
    }

    private nextThreshold() {
        return this.state.level * 100;
    }

    private levelUp() {
        this.state.progress -= this.nextThreshold();
        this.state.level++;
        bus.emit("classCard:levelUp", this.spec.id);
    }

    public getBonuses(): StatsModifier {
        return this.spec.statMod;
    }
    // ─── InventoryItem members ───────────────────────────
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
        return this.spec.rarity;
    }
    get quantity() {
        return 1;
    }

    get description() {
        return this.spec.description;
    }
    // ─────────────────────────────────────────────────────
}
