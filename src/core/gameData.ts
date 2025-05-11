/* ---------- Load raw JSON -------------------------------- */
import rawAreas from "@/data/areas.json";
import rawMonsters from "@/data/monsters.json";
import rawAttacks from "@/data/attacks.json";
import rawClassCards from "@/data/classCards.json";
import rawEquipment from "@/data/equipment.json";

/* ---------- Bring in the class constructors -------------- */
import { Area, AreaSpec } from "@/models/Area";
import { Monster, MonsterSpec } from "@/models/Monster";
import { Attack, AttackSpec } from "@/models/Attack";
import { ClassCard, CardSpec } from "@/features/classcards/ClassCard";
import { Equipment } from "@/models/Equipment";
import { EquipmentItem } from "@/shared/types";
//import

/* ---------- Register Data ---------------------------- */
export function initGameData() {
    console.log("📦 Registering game data…");
    Equipment.registerSpecs(rawEquipment as EquipmentItem[]);
    ClassCard.registerSpecs(rawClassCards as CardSpec[]);
    Monster.registerSpecs(rawMonsters as MonsterSpec[]);
    Area.registerSpecs(rawAreas as AreaSpec[]);
    Attack.registerSpecs(rawAttacks as AttackSpec[]);
}
