import { EquipmentItemSpec, InventoryItem, InventoryItemState, ItemEquipStatus } from "@/shared/types";
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

	public static override specById = new Map<string, EquipmentItemSpec>();
	static create(id: string): Equipment {
		const spec = this.specById.get(id);
		if (!spec) throw new Error(`Unknown card "${id}"`);

		const defaultState: InventoryItemState = {
			specId: spec.id,
			status: "Unequipped",
			level: 1,
			progress: 0,
		};
		return new Equipment(spec, defaultState);
	}
}
