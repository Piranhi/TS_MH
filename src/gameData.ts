/* ---------- Load raw JSON -------------------------------- */
import rawAreas    from "@/data/areas.json";
import rawMonsters from "@/data/monsters.json";
import rawAttacks  from "@/data/attacks.json";

/* ---------- Bring in the class constructors -------------- */
import { Area,     AreaSpec    } from "@/models/Area";
import { Monster,  MonsterSpec } from "@/models/Monster";
import { Attack,   AttackSpec  } from "@/models/attack";

/* ---------- Instantiate objects once --------------------- */
export const monsters = (rawMonsters as MonsterSpec[]).map(s => new Monster(s));
export const areas    = (rawAreas    as AreaSpec[]   ).map(s => new Area(s));
export const attacks  = (rawAttacks  as AttackSpec[] ).map(s => new Attack(s));

/* 👉 inject the registries once — no circular import */
Area._bootstrap(rawAreas as AreaSpec[], monsters);

/* ---------- Fast look‑up maps ---------------------------- */
export const monsterById = new Map(monsters.map(m => [m.id,  m]));
export const areaById    = new Map(areas   .map(a => [a.id, a]));
export const attackById  = new Map(attacks .map(a => [a.id, a]));

