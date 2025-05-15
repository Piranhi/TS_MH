/* ---------- Load raw JSON -------------------------------- */
import rawAreas from "@/data/areas.json" assert { type: "json" };
import rawMonsters from "@/data/monsters.json" assert { type: "json" };
import rawAbilities from "@/data/abilities.json" assert { type: "json" };
import rawClassCards from "@/data/classCards.json" assert { type: "json" };
import rawEquipment from "@/data/equipment.json" assert { type: "json" };

/* ---------- Bring in the class constructors -------------- */
import { Area } from "@/models/Area";
import { Monster, MonsterSpecRaw } from "@/models/Monster";
import { Ability } from "@/models/Ability";
import { ClassCard } from "@/features/classcards/ClassCard";
import { Equipment } from "@/models/Equipment";
import { ClassCardItemSpec, ClassCardItemSpecRaw, EquipmentItemSpec, EquipmentItemSpecRaw } from "@/shared/types";
import { InventoryRegistry } from "@/features/inventory/InventoryRegistry";
import { toBigNumberModifier } from "@/shared/utils/stat-utils";
import { toCoreStats } from "@/models/Stats";
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

	Monster.registerSpecs(
		(rawMonsters as MonsterSpecRaw[]).map((raw) => ({
			...raw,
			baseStats: toCoreStats(raw.baseStats),
		}))
	);
	Equipment.registerSpecs(equipmentSpecs);
	ClassCard.registerSpecs(classCardSpecs);
	Area.registerSpecs(rawAreas);
	Ability.registerSpecs(rawAbilities);

	InventoryRegistry.init();
}
