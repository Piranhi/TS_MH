import type { Monster } from "./Monster";

export interface AreaSpec {
	id: string;
	displayName: string;
	tier: number;
	levelRange: { min: number; max: number };
	spawns: { monsterId: string; weight: number }[];
	drops: { itemId: string; chance: number; qty: { min: number; max: number } }[];
	scaling: { hp: number; attack: number; defense: number; speed: number };
}

export interface Drop {
	itemId: string;
	qty: number;
}

export class Area {
	private static specById = new Map<string, AreaSpec>();
	private static monsterById = new Map<string, Monster>();

	/** Called exactly once from gameData.ts */
	static _bootstrap(specs: AreaSpec[], monsters: Monster[]) {
		this.specById = new Map(specs.map((s) => [s.id, s]));
		this.monsterById = new Map(monsters.map((m) => [m.id, m]));
        this.specById.forEach(spec => console.log(spec))
	}

	static createArea(id: string): Area {
		const spec = this.specById.get(id);
        console.log(spec?.displayName)
		if (!spec) throw new Error(`Unknown area "${id}"`);

		/* Make a fresh stateful copy (e.g. resets kills counter) */
		return new Area(spec);
	}

	public kills = 0;
	constructor(private readonly spec: AreaSpec) {}

	pickMonster(): Monster {


		const { spawns } = this.spec;
		const total = spawns.reduce((s, { weight }) => s + weight, 0);
		let roll = Math.random() * total;

		for (const { monsterId, weight } of spawns) {
			roll -= weight;
			if (roll <= 0) return Area.monsterById.get(monsterId)!;
		}

        return Area.monsterById.get(spawns[0].monsterId)!
	}

	rollLoot(): Drop[] {
		return this.spec.drops
			.filter((d) => Math.random() < d.chance)
			.map((d) => ({
				itemId: d.itemId,
				qty: d.qty.min + Math.floor(Math.random() * (d.qty.max - d.qty.min + 1)),
			}));
	}

	/* getters */
	get id() {
		return this.spec.id;
	}
	get displayName() {
		return this.spec.displayName;
	}

	/* ---------- Convenience factories ------------------------ */
}
