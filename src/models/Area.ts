import { Monster } from "./Monster";
import { SpecRegistryBase } from "./SpecRegistryBase";
import { AreaScaling } from "./Stats";
import { BigNumber } from "./utils/BigNumber";
import { InventoryRegistry } from "@/features/inventory/InventoryRegistry";

export interface AreaSpec {
	id: string;
	displayName: string;
	tier: number;
	requires: string[];
	spawns: Array<{ monsterId: string; weight: number; drops: { tags: string[]; chance: number } }>;
	boss: { monsterId: string; weight: number; drops: { tags: string[]; chance: number } };
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
		// Pick monster from spawns in spec
		const spawns = this.spec.spawns;
		const total = spawns.reduce((s, { weight }) => s + weight, 0);
		let roll = Math.random() * total;

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

	pickBoss(): Monster {
		const spawn = this.spec.boss;
		this.selectedSpawn = spawn;
		this.spawnedMonster = Monster.create(spawn.monsterId, this.spec.areaScaling)!;
		return this.spawnedMonster;
	}

	public rollLoot(): string[] {
		if (!this.selectedSpawn) {
			throw new Error("No monster picked — cannot roll loot");
		}

		const { tags, chance } = this.selectedSpawn.drops;
		const ids: string[] = [];

		// get every spec matching these tags
		const candidates = InventoryRegistry.getSpecsByTags(tags);
		for (const spec of candidates) {
			if (Math.random() < chance * this.spec.areaScaling.dropChance) {
				ids.push(spec.id);
			}
		}

		return ids;
	}

	// Scale Monster stats by Area
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
