import { Equipment } from "@/models/Equipment";
import { InventoryItemSpec, InventoryItemState } from "@/shared/types";
import { ClassCard } from "../classcards/ClassCard";
import { BalanceCalculators } from "@/balance/GameBalance";

export class InventoryRegistry {
	private static specMap: Map<string, InventoryItemSpec> = new Map();

	public static init(): void {
		// Equipment
		for (const spec of Equipment.getAllSpecs()) {
			this.specMap.set(spec.id, spec);
		}
		for (const spec of ClassCard.getAllSpecs()) {
			this.specMap.set(spec.id, spec);
		}
	}

	public static createItemState(id: string, quantity: number = 1): InventoryItemState {
		const spec = this.specMap.get(id);
		if (!spec) {
			throw new Error(`No spec registered for item ID "${id}"`);
		}
		const baseState: InventoryItemState = {
			specId: id,
			quantity,
			rarity: BalanceCalculators.getItemRarity(),
		};
		if (spec.category === "equipment" || spec.category == "classCard") {
			return {
				...baseState,
				status: "Unequipped",
				level: 1,
				progress: 0,
			};
		}
		return baseState;
	}

	public static getSpecsByTags(filterTags: string[]): InventoryItemSpec[] {
		return [...this.specMap.values()].filter((spec) =>
			// ensure spec.tags exists and contains all requested tags
			filterTags.every((tag) => spec.tags?.includes(tag) ?? false)
		);
	}

	public static hasItem(id: string): boolean {
		return this.specMap.has(id);
	}

	public static getItemById(id: string): InventoryItemSpec {
		const spec = this.specMap.get(id);
		if (!spec) {
			throw new Error(`No spec registered for item ID "${id}"`);
		}
		return spec;
	}
}
