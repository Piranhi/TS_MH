import { printLog } from "@/core/DebugManager";
import { Monster } from "./Monster";
import { SpecRegistryBase } from "./SpecRegistryBase";
import { AreaScaling } from "./Stats";
import { BigNumber } from "./utils/BigNumber";
import { InventoryRegistry } from "@/features/inventory/InventoryRegistry";

export interface AreaSpec {
	id: string;
	displayName: string;
	tier: number;
	levelRange: { min: number; max: number };
	spawns: { monsterId: string; weight: number; drops: { tags: string[]; weight: number } }[];
	areaScaling: AreaScaling;
}

export interface Drop {
	itemId: string;
	qty: number;
}

export class Area extends SpecRegistryBase<AreaSpec> {
	public kills = 0;
	private selectedSpawn?: AreaSpec["spawns"][0];
	private spawnedMonster?: Monster;
	constructor(private readonly spec: AreaSpec) {
		super();
	}

	pickMonster(): Monster {
		const spawns = this.spec.spawns;
		const total = spawns.reduce((s, { weight }) => s + weight, 0);
		let roll = Math.random() * total;
		printLog(this.spec.areaScaling.hp.toString(), 3);

		for (const spawn of spawns) {
			roll -= spawn.weight;
			if (roll <= 0) {
				this.selectedSpawn = spawn;
				this.spawnedMonster = Monster.create(spawn.monsterId, this.spec.areaScaling)!;
				return this.spawnedMonster;
			}
		}
		this.selectedSpawn = spawns[0];
		this.spawnedMonster = Monster.create(spawns[0].monsterId, this.spec.areaScaling)!;
		return this.spawnedMonster;
	}

	public rollLoot(): string[] {
		if (!this.selectedSpawn) {
			throw new Error("No monster picked — cannot roll loot");
		}

		const droppedIds: string[] = [];

		const candidates = InventoryRegistry.getSpecsByTags(this.selectedSpawn.drops.tags);
		for (const spec of candidates) {
			if (Math.random() < this.selectedSpawn.drops.weight * this.spec.areaScaling.dropChance) {
				droppedIds.push(spec.id);
			}
		}
		return droppedIds;
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
