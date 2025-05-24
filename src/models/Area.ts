import { Monster, MonsterSpec } from "./Monster";
import { SpecRegistryBase } from "./SpecRegistryBase";
import { MONSTER_ATTACK_GROWTH, MONSTER_DEFENCE_GROWTH, MONSTER_HP_GROWTH } from "./Stats";
import { InventoryRegistry } from "@/features/inventory/InventoryRegistry";

export interface AreaSpec {
	id: string;
	displayName: string;
	tier: number;
	requires: string[];
	spawns: Array<{ monsterId: string; weight: number; drops: { tags: string[]; chance: number } }>;
	boss: { monsterId: string; weight: number; drops: { tags: string[]; chance: number } };
	//areaScaling: AreaScaling;
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
				this.spawnedMonster = this.buildMonster(spawn.monsterId);
				return this.spawnedMonster;
			}
		}
		// Backup in case we don't pick a monster from weighting.
		this.selectedSpawn = spawns[0];
		this.spawnedMonster = this.buildMonster(spawns[0].monsterId);
		return this.spawnedMonster;
	}

	pickBoss(): Monster {
		const spawn = this.spec.boss;
		this.selectedSpawn = spawn;
		this.spawnedMonster = this.buildMonster(spawn.monsterId);
		return this.spawnedMonster;
	}

	private buildMonster(monsterId: string) {
		const templateSpec = Monster.getSpec(monsterId);
		if (!templateSpec) throw new Error(`Unknown monster "${monsterId}"`);

		const scaledSpec: MonsterSpec = structuredClone(templateSpec);
		console.log(this.spec.tier);

		scaledSpec.baseStats.hp = this.growth(templateSpec.baseStats.hp, MONSTER_HP_GROWTH);
		scaledSpec.baseStats.attack = this.growth(templateSpec.baseStats.attack, MONSTER_ATTACK_GROWTH);
		scaledSpec.baseStats.defence = this.growth(templateSpec.baseStats.defence, MONSTER_DEFENCE_GROWTH);
		//scaled.baseStats.speed = this.growth(templateSpec.baseStats.speed, 1);

		return Monster.create(scaledSpec);
	}

	/** Returns the scaling factor for a given area (area 1 → 1.0) */
	private growth(base: number, factor: number): number {
		return base * Math.pow(factor, this.spec.tier - 1);
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
			if (Math.random() < chance * 5) {
				// TODO - WORK OUT SCALING FOR DROP CHANCE this.spec.areaScaling.dropChance) {
				ids.push(spec.id);
			}
		}

		return ids;
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
