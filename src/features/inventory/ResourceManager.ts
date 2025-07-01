import { Destroyable } from "@/core/Destroyable";
import { bus } from "../../core/EventBus";
import { Saveable } from "@/shared/storage-types";
import { ResourceData, ResourceRequirement, ResourceUpgradeEffect } from "@/shared/types";
import { RESOURCE_UPGRADES } from "@/balance/GameBalance";

interface ResourceManagerSaveState {
	resourceData: ResourceData[];
}

export class ResourceManager extends Destroyable implements Saveable {
	private resources = new Map<string, ResourceData>();
	private readonly MAX_LEVEL = 50;

	constructor() {
		super();
		bus.on("Game:GameTick", (dt) => this.handleTick(dt));
		this.setUnlockedResources();
	}

	private handleTick(dt: number) {}

	addResource(id: string, qty: number) {
		const existing = this.resources.get(id);

		if (existing && existing.infinite) return;

		if (existing) {
			existing.quantity += qty;
			existing.quantity = Math.ceil(existing.quantity);
		} else {
			this.resources.set(id, {
				quantity: qty,
				level: 1,
				xp: 0,
				isUnlocked: true,
				infinite: false,
			});
		}
		this.emitChange();
	}

	private setUnlockedResources() {
		this.setResourceUnlocked("raw_ore");
		this.setResourceUnlocked("iron_ingot");
		this.setResourceUnlocked("charstone");
		this.setResourceUnlocked("iron_bar");
		this.setResourceUnlocked("clear_quartz");
		this.setResourceUnlocked("forge_flux");
	}

	private setResourceUnlocked(id: string) {
		this.resources.set(id, {
			quantity: 0,
			level: 1,
			xp: 0,
			isUnlocked: true,
			infinite: false,
		});
		this.emitChange();
	}

	public getResourceQuantity(id: string): number {
		return this.resources.get(id)?.quantity || 0;
	}

	public hasResource(id: string): boolean {
		return this.resources.has(id);
	}

	public consumeResource(id: string, qty: number): boolean {
		const resourceAmt = this.resources.get(id)?.quantity;
		if (!resourceAmt || resourceAmt < qty) return false; // Not enough resources

		this.resources.get(id)!.quantity -= qty;
		this.emitChange();
		return true;
	}

	public addResourceXP(id: string, xp: number) {
		const data = this.resources.get(id);
		if (!data) return;
		if (data.infinite) return;
		data.xp += xp;
		while (data.level < this.MAX_LEVEL && data.xp >= this.getXpForNextLevel(data.level)) {
			data.xp -= this.getXpForNextLevel(data.level);
			data.level += 1;
			if (data.level >= this.MAX_LEVEL) {
				data.infinite = true;
				data.quantity = Number.MAX_SAFE_INTEGER;
				break;
			}
		}
		this.emitChange();
	}

	private getXpForNextLevel(level: number): number {
		return level * 10;
	}

	public canAfford(requirements: ResourceRequirement[]): boolean {
		return requirements.every((req) => this.getResourceQuantity(req.resource) >= req.quantity);
	}

	public getResourceData(id: string): ResourceData | undefined {
		return this.resources.get(id);
	}

	public getAllResources(): Map<string, ResourceData> {
		return new Map(Array.from(this.resources.entries()).map(([key, value]) => [key, { ...value }]));
	}

	public getAllUpgrades(resourceId: string): ResourceUpgradeEffect[] {
		return RESOURCE_UPGRADES;
	}

	public getActiveUpgrades(resourceId: string): ResourceUpgradeEffect[] {
		const resourceData = this.getResourceData(resourceId);
		if (!resourceData) return [];

		return RESOURCE_UPGRADES.filter((upgrade) => resourceData.level >= upgrade.level);
	}

	// Fixed resource cost calculation
	public getResourceCostReduction(resourceId: string): number {
		const totalReduction = this.getActiveUpgrades(resourceId).reduce(
			(total, upgrade) => total + (upgrade.effects.resourceCostReduction || 0),
			0
		);

		// Convert percentage to multiplier (21% reduction = 0.79 multiplier)
		return 1 - totalReduction / 100;
	}

	// Renamed and fixed craft speed calculation
	public getCraftSpeedMultiplier(resourceId: string): number {
		const totalSpeedBonus = this.getActiveUpgrades(resourceId).reduce(
			(total, upgrade) => total + (upgrade.effects.craftSpeedReduction || 0),
			0
		);

		// Convert percentage to multiplier (13% faster = 1.13 multiplier)
		return 1 + totalSpeedBonus / 100;
	}

	// For UI display - show what's coming next
	public getNextUpgrade(resourceId: string): ResourceUpgradeEffect | null {
		const resourceData = this.getResourceData(resourceId);
		if (!resourceData) return null;

		return RESOURCE_UPGRADES.find((upgrade) => upgrade.level > resourceData.level) || null;
	}

	// SAVE + LOAD

	public save(): ResourceManagerSaveState {
		// Save both the resource ID and its data
		return {
			resourceData: Array.from(this.resources.entries()).map(([id, value]) => ({ id, ...value })),
		};
	}

	public load(state: ResourceManagerSaveState): void {
		this.resources = new Map(
			(state.resourceData || []).map((data: any) => {
				const { id, ...resourceData } = data;
				return [id, resourceData];
			})
		);
	}

	emitChange() {
		bus.emit("resources:changed");
	}
}
