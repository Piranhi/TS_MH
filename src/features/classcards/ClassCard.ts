import { bus } from "@/core/EventBus";
import { SpecRegistryBase } from "@/models/SpecRegistryBase";
import { StatsModifier } from "@/models/Stats";
import { ClassCardItemSpec, getItemRarity, InventoryItem, InventoryItemState } from "@/shared/types";

export class ClassCard extends SpecRegistryBase<ClassCardItemSpec> implements ClassCardItemSpec, InventoryItem {
	readonly category = "classCard";

	private constructor(private readonly spec: ClassCardItemSpec, private state: InventoryItemState) {
		super();
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
		return this.state.rarity;
	}
	get quantity() {
		return 1;
	}

	get abilities() {
		return this.spec.abilities;
	}

	get description() {
		return this.spec.description;
	}

	get statMod() {
		return this.spec.statMod;
	}

	get baseGainRate() {
		return this.spec.baseGainRate;
	}

	// ─────────────────────────────────────────────────────

	toJSON() {
		return {
			__type: "ClassCard",
			spec: this.spec.id,
			state: this.state,
		};
	}

	static fromJSON(raw: any) {
		const spec = this.specById.get(raw.spec);
		if (!spec) throw new Error(`Unknown card "${raw.spec}"`);
		return new ClassCard(spec, raw.state);
	}

	public static override specById = new Map<string, ClassCardItemSpec>();
	static create(id: string): ClassCard {
		const spec = this.specById.get(id);
		if (!spec) throw new Error(`Unknown card "${id}"`);

		const defaultState: InventoryItemState = {
			specId: spec.id,
			status: "Unequipped",
			level: 1,
			progress: 0,
			rarity: getItemRarity(),
		};
		return new ClassCard(spec, defaultState);
	}
}
