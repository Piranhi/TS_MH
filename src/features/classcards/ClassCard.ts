import { ClassCardItemSpec, InventoryItemState, UpgradableItem } from "@/shared/types";
import { InventoryItem } from "../inventory/InventoryItem";

export class ClassCard extends InventoryItem<ClassCardItemSpec> implements ClassCardItemSpec, UpgradableItem {
	readonly category = "classCard";

	private constructor(readonly spec: ClassCardItemSpec, state: InventoryItemState) {
		super(spec, state);
	}

	// ─── InventoryItem members ───────────────────────────

	get abilities() {
		return this.spec.abilities;
	}

	get baseGainRate() {
		return this.spec.baseGainRate;
	}

	// ─────────────────────────────────────────────────────



	static fromJSON(raw: any) {
		const spec = this.specById.get(raw.spec);
		if (!spec) throw new Error(`Unknown card "${raw.spec}"`);
		return new ClassCard(spec, raw.state);
	}

	public static override specById = new Map<string, ClassCardItemSpec>();

	static createFromState(state: InventoryItemState): ClassCard {
		const spec = this.specById.get(state.specId);
		if (!spec) throw new Error(`Unknown card "${state.specId}"`);
		return new ClassCard(spec, state);
	}
}
