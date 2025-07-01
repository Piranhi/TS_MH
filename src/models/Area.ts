import { BalanceCalculators, GAME_BALANCE } from "@/balance/GameBalance";
import { Monster, MonsterSpec } from "./Monster";
import { SpecRegistryBase } from "./SpecRegistryBase";
import { InventoryRegistry } from "@/features/inventory/InventoryRegistry";

export interface AreaSpec {
	id: string;
	displayName: string;
	tier: number;
	requires: string[];
	spawns: Array<{ monsterId: string; weight: number; drops: { tags: string[]; baseDropChance: number } }>;
	boss: { monsterId: string; weight: number; drops: { tags: string[]; baseDropChance: number } };
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

	private buildMonster(monsterId: string): Monster {
		const templateSpec = Monster.getSpec(monsterId);
		if (!templateSpec) throw new Error(`Unknown monster "${monsterId}"`);

		// Much simpler - let Monster handle the scaling
		return Monster.create(templateSpec, this.spec.tier);
	}

	public rollLoot(): string[] {
		// TODO - Change loot in JSON into an array, so we can have different drop chances of rarer categories.
		if (!this.selectedSpawn) {
			throw new Error("No monster picked — cannot roll loot");
		}

		const { tags, baseDropChance } = this.selectedSpawn.drops;
		const ids: string[] = [];

		// get every spec matching these tags
		const candidates = InventoryRegistry.getSpecsByTags(tags);
		const tier = this.spec.tier;
		const decayFactor = GAME_BALANCE.loot.dropDecayFactor;
		const minFloor = GAME_BALANCE.loot.baseDropChance;
		const scaledDropChance = minFloor + (baseDropChance - minFloor) * Math.pow(decayFactor, tier - 1);

		for (const spec of candidates) {
			if (Math.random() < scaledDropChance) {
				ids.push(spec.id);
			}
		}
		return ids;
	}

	public rollOfflineLoot(): string[] {
		// For offline, we need to pick a representative spawn first
		if (!this.selectedSpawn) {
			// Pick a random spawn for offline loot generation
			this.selectedSpawn = this.getRandomSpawn();
		}

		const { tags, baseDropChance } = this.selectedSpawn.drops;
		const ids: string[] = [];

		// Get candidates and check if any exist
		const candidates = InventoryRegistry.getSpecsByTags(tags);
		if (candidates.length === 0) {
			console.warn(`No items found for tags: ${tags.join(", ")}`);
			return ids; // Return empty array instead of crashing
		}

		// Generate 1-4 items
		const numItems = Math.floor(Math.random() * 4) + 1;

		for (let i = 0; i < numItems; i++) {
			// Fixed: Proper array indexing
			const randomIndex = Math.floor(Math.random() * candidates.length);
			const selectedItem = candidates[randomIndex];

			// Optional: Respect drop chance (reduced for offline to avoid too many rares)
			const offlineDropChance = baseDropChance * 0.5; // 50% of normal drop rate for offline

			ids.push(selectedItem.id);
		}

		return ids;
	}

	public getXpPerKill(boss: boolean): number {
		if (boss) return this.tier * 40;
		return this.tier * 3;
	}

	// Helper method to pick a spawn without mutating current combat state
	private getRandomSpawn() {
		const allSpawns = this.spec.spawns;
		const totalWeight = allSpawns.reduce((sum, spawn) => sum + spawn.weight, 0);
		let roll = Math.random() * totalWeight;

		for (const spawn of allSpawns) {
			roll -= spawn.weight;
			if (roll <= 0) {
				return spawn;
			}
		}

		return allSpawns[0]; // Fallback
	}

	/* getters */
	get id() {
		return this.spec.id;
	}
	get displayName() {
		return this.spec.displayName;
	}

	get tier(): number {
		return this.spec.tier;
	}

	get spawns() {
		return this.spec.spawns;
	}

	get boss() {
		return this.spec.boss;
	}

	get requires() {
		return this.spec.requires;
	}

	// Registry.
	public static override specById = new Map<string, AreaSpec>();
	static create(id: string): Area {
		const spec = this.specById.get(id);
		if (!spec) throw new Error(`Unknown area "${id}"`);
		return new Area(spec);
	}
}
