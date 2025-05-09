import { ClassCard } from "@/features/classcards/ClassCard";
import type { EquipmentItem, InventoryItem, ItemCategory } from "@/shared/types";

export function isEquipmentItem(item: InventoryItem): item is EquipmentItem & { category: "equipment" } {
	return item.category === "equipment";
}

export function isClassCardItem(item: InventoryItem): item is ClassCard 
 {
    if(item.category !== "classCard") return false;
	return item instanceof ClassCard;
}
