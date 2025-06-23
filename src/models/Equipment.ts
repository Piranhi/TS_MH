import { EquipmentItemSpec, EquipmentType, InventoryItemState, Resistances, UpgradableItem } from "@/shared/types";
import { InventoryItem } from "@/features/inventory/InventoryItem";

export class Equipment extends InventoryItem<EquipmentItemSpec> implements EquipmentItemSpec, UpgradableItem {
	readonly category = "equipment";

	private constructor(readonly spec: EquipmentItemSpec, state: InventoryItemState) {
		super(spec, state);
	}
	// Returns: "head" | "back" | "chest" | "legs" | "feet" | "hands" | "finger1" | "finger2" | "neck" | "weapon" | "weapon2";
	get equipType(): EquipmentType {
		return this.spec.equipType;
	}

	public getResistances(): Partial<Resistances> {
		return this.spec.resistances ?? {};
	}

	// ─────────────────────────────────────────────────────

	static fromJSON(raw: any) {
		const spec = this.specById.get(raw.spec);
		if (!spec) throw new Error(`Unknown equipment "${raw.spec}"`);
		return new Equipment(spec, raw.state);
	}

	public static override specById = new Map<string, EquipmentItemSpec>();

	static createFromState(state: InventoryItemState): Equipment {
		const spec = this.specById.get(state.specId);
		if (!spec) throw new Error(`Unknown equipment "${state.specId}"`);
		return new Equipment(spec, state);
	}
}
