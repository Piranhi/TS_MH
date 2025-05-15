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
import { ClassCardItemSpec, ClassCardItemSpecRaw, EquipmentItemSpec, EquipmentItemSpecRaw } from "@/shared/types";
import { InventoryRegistry } from "@/features/inventory/InventoryRegistry";
import { toBigNumberModifier } from "@/shared/utils/stat-utils";
//import

//const abilities = (rawAbilities as any[]).map((a) => new Ability(a.id, a.displayName, a.cooldown, a.effects));

/* ---------- Register Data ---------------------------- */
export function initGameData() {
	console.log("📦 Registering game data…");

	const equipmentSpecs: EquipmentItemSpec[] = (rawEquipment as EquipmentItemSpecRaw[]).map((raw) => ({
		...raw,
		statMod: toBigNumberModifier(raw.statMod),
	}));

	const classCardSpecs: ClassCardItemSpec[] = (rawClassCards as ClassCardItemSpecRaw[]).map((raw) => ({
		...raw,
		statMod: toBigNumberModifier(raw.statMod),
	}));

	Equipment.registerSpecs(equipmentSpecs);
	ClassCard.registerSpecs(classCardSpecs);
	Monster.registerSpecs(rawMonsters);
	Area.registerSpecs(rawAreas);
	Ability.registerSpecs(rawAbilities as AbilitySpec[]);

	InventoryRegistry.init();
}
