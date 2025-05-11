// Instance data
export interface EquipmentState {
    specId: string;
    status: ItemEquipStatus;
    level: number;
    progress: number;
}

import { EquipmentItem, ItemEquipStatus } from "@/shared/types";

export class Equipment implements EquipmentItem {
    private static specById = new Map<string, EquipmentItem>();
    readonly category = "equipment";
    private readonly spec: EquipmentItem;
    private readonly state: EquipmentState;

    private constructor(spec: EquipmentItem, state: EquipmentState) {
        this.spec = spec;
        this.state = state;
    }

    static registerSpecs(specs: EquipmentItem[]) {
        specs.forEach((s) => this.specById.set(s.id, s));
    }
    // Build a brand new card with default state;
    static create(id: string): Equipment {
        const spec = this.specById.get(id);
        if (!spec) throw new Error(`Unknown card "${id}"`);

        const defaultState: EquipmentState = {
            specId: spec.id,
            status: "Unequipped",
            level: 1,
            progress: 0,
        };
        return new Equipment(spec, defaultState);
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
        return this.spec.rarity;
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
}
