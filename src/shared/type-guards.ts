import { ClassCard } from "@/features/classcards/ClassCard";
import type { EquipmentItemSpec, InventoryItemSpec, ItemCategory } from "@/shared/types";

export function isEquipmentItemSpec(item: InventoryItemSpec): item is EquipmentItemSpec & { category: "equipment" } {
	return item.category === "equipment";
}

export function isClassCardItemSpec(item: InventoryItemSpec): item is ClassCard {
	if (item.category !== "classCard") return false;
	return item instanceof ClassCard;
}
