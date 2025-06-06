/* ---------- Load raw JSON -------------------------------- */
import rawAreas from "@/data/areas.json" assert { type: "json" };
import rawMonsters from "@/data/monsters.json" assert { type: "json" };
import rawAbilities from "@/data/abilities.json" assert { type: "json" };
import rawClassCards from "@/data/classCards.json" assert { type: "json" };
import rawEquipment from "@/data/equipment.json" assert { type: "json" };
import rawBuilding from "@/data/buildings.json" assert { type: "json" };
import rawTriggers from "@/data/progression-triggers.json" assert { type: "json" };
import rawOutposts from "@/data/outposts.json" assert { type: "json" };

/* ---------- Bring in the class constructors -------------- */
import { Area } from "@/models/Area";
import { Monster, MonsterSpec } from "@/models/Monster";
import { Ability, AbilitySpec } from "@/models/Ability";
import { ClassCard } from "@/features/classcards/ClassCard";
import { Equipment } from "@/models/Equipment";
import { ClassCardItemSpec, EquipmentItemSpec, OutpostSpec, ProgressionTrigger } from "@/shared/types";
import { InventoryRegistry } from "@/features/inventory/InventoryRegistry";
import { Building } from "@/features/settlement/Building";
import { MilestoneManager } from "@/models/MilestoneManager";
import { Outpost } from "@/features/hunt/Outpost";

/* ---------- Register Data ---------------------------- */

//export let areaManager: AreaManager;
export const milestoneManager = MilestoneManager.instance;
export function initGameData() {
    console.log("📦 Registering game data…");

    Building.registerSpecs(rawBuilding);
    Equipment.registerSpecs(rawEquipment as EquipmentItemSpec[]);
    ClassCard.registerSpecs(rawClassCards as ClassCardItemSpec[]);
    Monster.registerSpecs(rawMonsters as MonsterSpec[]);
    Area.registerSpecs(rawAreas);
    Ability.registerSpecs(rawAbilities as AbilitySpec[]);
    Outpost.registerSpecs(rawOutposts as OutpostSpec[]);

    InventoryRegistry.init();

    milestoneManager.registerSpecs(rawTriggers as ProgressionTrigger[]);
}
