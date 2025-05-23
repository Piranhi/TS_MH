import { EquipmentItemSpec, InventoryItemState } from "@/shared/types";
import { SpecRegistryBase } from "./SpecRegistryBase";

export class Equipment extends SpecRegistryBase<EquipmentItemSpec> implements EquipmentItemSpec {
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
}
