import { EquipmentItemSpec, getItemRarity, InventoryItem, InventoryItemState } from "@/shared/types";
import { SpecRegistryBase } from "./SpecRegistryBase";

export class Equipment extends SpecRegistryBase<EquipmentItemSpec> implements EquipmentItemSpec, InventoryItem {
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
	static create(id: string): Equipment {
		const spec = this.specById.get(id);
		if (!spec) throw new Error(`Unknown card "${id}"`);

		const defaultState: InventoryItemState = {
			specId: spec.id,
			status: "Unequipped",
			level: 1,
			progress: 0,
			rarity: getItemRarity(),
		};
		return new Equipment(spec, defaultState);
	}
}
