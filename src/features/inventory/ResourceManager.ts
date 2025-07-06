import { Destroyable } from "@/core/Destroyable";
import { bus } from "../../core/EventBus";
import { Saveable } from "@/shared/storage-types";
import { ResourceData, ResourceRequirement, ResourceUpgradeEffect } from "@/shared/types";
import { RESOURCE_UPGRADES } from "@/balance/GameBalance";
import { Resource } from "./Resource";
import { GameContext } from "@/core/GameContext";

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
        this.setResourceUnlocked("copper_bar");
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
        data.xp += xp < 0 ? this.getXpForNextLevel(data.level) : xp;
        while (data.level < this.MAX_LEVEL && data.xp >= this.getXpForNextLevel(data.level)) {
            data.xp -= this.getXpForNextLevel(data.level);
            const previousLevel = data.level;
            data.level += 1;

            // Check for level-based unlocks
            this.processLevelUnlocks(id, previousLevel, data.level);

            if (data.level >= this.MAX_LEVEL) {
                data.infinite = true;
                data.quantity = Number.MAX_SAFE_INTEGER;
                break;
            }
        }
        this.emitChange();
    }

    private processLevelUnlocks(resourceId: string, previousLevel: number, currentLevel: number) {
        const spec = Resource.getSpec(resourceId);
        if (!spec?.unlocks) return;

        // Check if any unlocks should happen at the current level
        for (const unlock of spec.unlocks) {
            if (unlock.level === currentLevel) {
                this.setResourceUnlocked(unlock.id);
            }
        }
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

    /** Calculate the total starting amount for a resource based on its level */
    public getPrestigeStartAmount(resourceId: string): number {
        return this.getActiveUpgrades(resourceId).reduce((total, upg) => total + (upg.effects.prestigeStartAmount || 0), 0);
    }

    /** Apply saved resource levels and set quantities for a new prestige run */
    public applyPrestigeResources(data: Map<string, ResourceData>): void {
        data.forEach((saved, id) => {
            const current = this.resources.get(id);
            if (!current) return;
            current.level = saved.level;
            current.xp = saved.xp;
            current.infinite = saved.infinite;
            current.isUnlocked = saved.isUnlocked;
            current.quantity = current.infinite ? Number.MAX_SAFE_INTEGER : this.getPrestigeStartAmount(id);
        });
        this.emitChange();
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
        const totalReduction = this.getActiveUpgrades(resourceId).reduce((total, upgrade) => total + (upgrade.effects.resourceCostReduction || 0), 0);

        // Convert percentage to multiplier (21% reduction = 0.79 multiplier)
        return 1 - totalReduction / 100;
    }

    // Renamed and fixed craft speed calculation
    public getCraftSpeedMultiplier(resourceId: string): number {
        const totalSpeedBonus = this.getActiveUpgrades(resourceId).reduce((total, upgrade) => total + (upgrade.effects.craftSpeedReduction || 0), 0);

        // Convert percentage to multiplier (13% faster = 1.13 multiplier)
        return 1 + totalSpeedBonus / 100;
    }

    /**
     * Calculate the real crafting time and resource costs for a resource.
     * This factors in resource upgrades, blacksmith upgrades, and settlement bonuses.
     */
    public getCraftingData(resourceId: string): { time: number; costs: ResourceRequirement[] } {
        const spec = Resource.getSpec(resourceId);
        if (!spec) return { time: 0, costs: [] };

        const baseTime = spec.craftTime;
        const baseCosts = spec.requires;

        // Upgrades from resource level
        const resourceSpeed = this.getCraftSpeedMultiplier(resourceId);
        const resourceCost = this.getResourceCostReduction(resourceId);

        // Upgrades from the blacksmith
        const blacksmithSpeed = GameContext.getInstance().blacksmith.getSpeedMultiplier();

        // Settlement/building modifiers - placeholder for future expansion
        let settlementSpeed = 1;
        let settlementCost = 1;

        const totalSpeed = resourceSpeed * blacksmithSpeed * settlementSpeed;
        const totalCostMult = resourceCost * settlementCost;

        const costs = baseCosts.map((c) => ({
            resource: c.resource,
            quantity: Math.ceil(c.quantity * totalCostMult),
        }));

        return { time: baseTime / totalSpeed, costs };
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
            }),
        );
    }

    emitChange() {
        bus.emit("resources:changed");
    }
}
