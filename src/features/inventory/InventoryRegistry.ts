import { Equipment } from "@/models/Equipment";
import { InventoryItem, InventoryItemSpec } from "@/shared/types";
import { ClassCard } from "../classcards/ClassCard";

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

	public static createItem(id: string, quantity: number = 1): InventoryItem {
		const spec = this.specMap.get(id);
		if (!spec) {
			throw new Error(`No spec registered for item ID "${id}"`);
		}
		return { ...spec, quantity };
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
}
