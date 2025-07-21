import type { EquipmentItemSpec, InventoryItemSpec } from "@/shared/types";

export function isEquipmentItemSpec(item: InventoryItemSpec): item is EquipmentItemSpec & { category: "equipment" } {
	return item.category === "equipment";
}
