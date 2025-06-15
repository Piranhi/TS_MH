/* ---------- Load raw JSON -------------------------------- */
import rawAreas from "@/data/areas.json" assert { type: "json" };
import rawMonsters from "@/data/monsters.json" assert { type: "json" };
import rawAbilities from "@/data/abilities.json" assert { type: "json" };
import rawClassCards from "@/data/classCards.json" assert { type: "json" };
import rawEquipment from "@/data/equipment.json" assert { type: "json" };
import rawBuilding from "@/data/buildings.json" assert { type: "json" };
import rawResearch from "@/data/research.json" assert { type: "json" };
import rawTriggers from "@/data/progression-triggers.json" assert { type: "json" };
import rawOutposts from "@/data/outposts.json" assert { type: "json" };
import rawTraits from "@/data/traits.json" assert { type: "json" };
import rawResource from "@/data/resources.json" assert { type: "json" };

/* ---------- Bring in the class constructors -------------- */
import { Area } from "@/models/Area";
import { Monster, MonsterSpec } from "@/models/Monster";
import { Ability, AbilitySpec } from "@/models/Ability";
import { ClassCard } from "@/features/classcards/ClassCard";
import { Equipment } from "@/models/Equipment";
import { ClassCardItemSpec, EquipmentItemSpec, OutpostSpec, ProgressionTrigger, ResearchSpec, TraitSpec } from "@/shared/types";
import { InventoryRegistry } from "@/features/inventory/InventoryRegistry";
import { Building } from "@/features/settlement/Building";
import { MilestoneManager } from "@/models/MilestoneManager";
import { Outpost } from "@/features/hunt/Outpost";
import { ResearchUpgrade } from "@/features/settlement/ResearchUpgrade";
import { Trait } from "@/models/Trait";
import { Resource } from "@/features/inventory/Resource";
import { ResourceSpec } from "@/features/inventory/ResourceManager";

/* ---------- Register Data ---------------------------- */

//export let areaManager: AreaManager;
export const milestoneManager = MilestoneManager.instance;
export function initGameData() {
	console.log("📦 Registering game data…");

	Building.registerSpecs(rawBuilding);
	ResearchUpgrade.registerSpecs(rawResearch as ResearchSpec[]);
	Equipment.registerSpecs(rawEquipment as EquipmentItemSpec[]);
	ClassCard.registerSpecs(rawClassCards as ClassCardItemSpec[]);
	Monster.registerSpecs(rawMonsters as MonsterSpec[]);
	Area.registerSpecs(rawAreas);
	Ability.registerSpecs(rawAbilities as AbilitySpec[]);
	Outpost.registerSpecs(rawOutposts as OutpostSpec[]);
	Trait.registerSpecs(rawTraits as TraitSpec[]);
	Resource.registerSpecs(rawResource as ResourceSpec[]);

	InventoryRegistry.init();

	milestoneManager.registerSpecs(rawTriggers as ProgressionTrigger[]);
}
