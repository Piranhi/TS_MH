import { printLog } from "@/core/DebugManager";
import { Monster } from "./Monster";
import { SpecRegistryBase } from "./SpecRegistryBase";
import { AreaScaling } from "./Stats";
import { BigNumber } from "./utils/BigNumber";

export interface AreaSpec {
	id: string;
	displayName: string;
	tier: number;
	levelRange: { min: number; max: number };
	spawns: { monsterId: string; weight: number }[];
	drops: { itemId: string; chance: number; qty: { min: number; max: number } }[];
	areaScaling: AreaScaling;
}

export interface Drop {
	itemId: string;
	qty: number;
}

export class Area extends SpecRegistryBase<AreaSpec> {
	public kills = 0;
	constructor(private readonly spec: AreaSpec) {
		super();
	}

	pickMonster(): Monster {
		const { spawns } = this.spec;
		const total = spawns.reduce((s, { weight }) => s + weight, 0);
		let roll = Math.random() * total;
		printLog(this.spec.areaScaling.hp.toString(), 3);

		for (const { monsterId, weight } of spawns) {
			roll -= weight;
			if (roll <= 0) return Monster.create(monsterId, this.spec.areaScaling)!;
		}

		return Monster.create(spawns[0].monsterId, this.spec.areaScaling)!;
	}

	rollLoot(): Drop[] {
		return this.spec.drops
			.filter((d) => Math.random() < d.chance)
			.map((d) => ({
				itemId: d.itemId,
				qty: d.qty.min + Math.floor(Math.random() * (d.qty.max - d.qty.min + 1)),
			}));
	}

	getScaledValue(base: number | BigNumber, prop: keyof AreaScaling): number | BigNumber {
		if (typeof base === "number") {
			return base * this.spec.areaScaling[prop];
		} else {
			return base.multiply(this.spec.areaScaling[prop]);
		}
	}

	/* getters */
	get id() {
		return this.spec.id;
	}
	get displayName() {
		return this.spec.displayName;
	}

	// Registry.
	public static override specById = new Map<string, AreaSpec>();
	static create(id: string): Area {
		const spec = this.specById.get(id);
		if (!spec) throw new Error(`Unknown area "${id}"`);
		return new Area(spec);
	}
}
