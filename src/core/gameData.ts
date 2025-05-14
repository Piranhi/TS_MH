/* ---------- Load raw JSON -------------------------------- */
import rawAreas from "@/data/areas.json" assert { type: "json" };
import rawMonsters from "@/data/monsters.json" assert { type: "json" };
import rawAttacks from "@/data/attacks.json" assert { type: "json" };
import rawClassCards from "@/data/classCards.json" assert { type: "json" };
import rawEquipment from "@/data/equipment.json" assert { type: "json" };

/* ---------- Bring in the class constructors -------------- */
import { Area } from "@/models/Area";
import { Monster } from "@/models/Monster";
import { Attack, AttackSpec } from "@/models/Attack";
import { ClassCard } from "@/features/classcards/ClassCard";
import { Equipment } from "@/models/Equipment";
import { ClassCardItemSpec, EquipmentItemSpec } from "@/shared/types";
import { InventoryRegistry } from "@/features/inventory/InventoryRegistry";
//import

/* ---------- Register Data ---------------------------- */
export function initGameData() {
	console.log("📦 Registering game data…");
	Equipment.registerSpecs(rawEquipment as EquipmentItemSpec[]);
	ClassCard.registerSpecs(rawClassCards as ClassCardItemSpec[]);
	Monster.registerSpecs(rawMonsters);
	Area.registerSpecs(rawAreas);
	Attack.registerSpecs(rawAttacks as AttackSpec[]);

	InventoryRegistry.init();
}
