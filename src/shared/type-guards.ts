import type { EquipmentItem, InventoryItem, ItemCategory } from "@/shared/types";

export function isEquipmentItem(item: InventoryItem): item is EquipmentItem & { category: "equipment" } {
	return item.category === "equipment";
}

export function isClassCardItem(item: InventoryItem): item is InventoryItem & { category: "classCard" } {
	return item.category === "classCard";
}
