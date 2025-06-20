import { InventoryItemState, EquipmentItemSpec, ClassCardItemSpec } from "@/shared/types";
import { scaleStatsModifier } from "@/shared/utils/stat-utils";
import { SpecRegistryBase } from "@/models/SpecRegistryBase";
import { StatsModifier } from "@/models/Stats";
import { UpgradeCalculator } from "@/models/UpgradeCalculator";

export abstract class InventoryItem<T extends EquipmentItemSpec | ClassCardItemSpec> extends SpecRegistryBase<T> {
	constructor(protected readonly spec: T, protected state: InventoryItemState) {
		super();
	}

	public getBonuses(): StatsModifier {
		return scaleStatsModifier(this.spec.statMod, this.state.rarity ?? "common", this.state.heirloom ?? 0);
	}

	public equip() {
		this.state.status = "Equipped";
	}

	public unequip() {
		this.state.status = "Unequipped";
	}

	// Common properties both items need
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
	get statMod() {
		return this.spec.statMod;
	}

	// We only add heirloom to equipped equipment during prestige.
	public addHeirloom(amount: number) {
		this.state.heirloom = (this.state.heirloom ?? 0) + amount;
	}

	// Add levels to the item
	// If over level 100, upgrade the rarity
	public addLevels(amount: number): void {
		const result = UpgradeCalculator.calculate(this.level, this.rarity!, amount);
		this.state.level = result.newLevel;
		this.state.rarity = result.newRarity;

		if (result.upgradedRarity) {
			// Could emit an event, show particles, etc.
			//bus.emit("item:rarityUpgraded", { item: this, newRarity: result.newRarity });
		}
	}

	// ─────────────────────────────────────────────────────

	toJSON() {
		return {
			__type: this.constructor.name, //"Equipment" or "ClassCard",
			spec: this.spec.id,
			state: this.state,
		};
	}
}
