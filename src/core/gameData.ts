/* ---------- Load raw JSON -------------------------------- */
import rawAreas from "@/data/areas.json" assert { type: "json" };
import rawMonsters from "@/data/monsters.json" assert { type: "json" };
import rawAbilities from "@/data/abilities.json" assert { type: "json" };
import rawClassCards from "@/data/classCards.json" assert { type: "json" };
import rawEquipment from "@/data/equipment.json" assert { type: "json" };

/* ---------- Bring in the class constructors -------------- */
import { Area } from "@/models/Area";
import { Monster } from "@/models/Monster";
import { Ability, AbilitySpec } from "@/models/Ability";
import { ClassCard } from "@/features/classcards/ClassCard";
import { Equipment } from "@/models/Equipment";
import { ClassCardItemSpec, EquipmentItemSpec } from "@/shared/types";
import { InventoryRegistry } from "@/features/inventory/InventoryRegistry";
//import

//const abilities = (rawAbilities as any[]).map((a) => new Ability(a.id, a.displayName, a.cooldown, a.effects));

/* ---------- Register Data ---------------------------- */
export function initGameData() {
	console.log("📦 Registering game data…");
	Equipment.registerSpecs(rawEquipment as EquipmentItemSpec[]);
	ClassCard.registerSpecs(rawClassCards as ClassCardItemSpec[]);
	Monster.registerSpecs(rawMonsters);
	Area.registerSpecs(rawAreas);
	Ability.registerSpecs(rawAbilities as AbilitySpec[]);

	InventoryRegistry.init();
}
