// AreaManager.ts - Updated to work with SettlementManager for outposts
import { debugManager, printLog } from "@/core/DebugManager";
import { bus } from "@/core/EventBus";
import { Area, AreaSpec } from "@/models/Area";
import { Destroyable } from "@/core/Destroyable";
import { MilestoneManager } from "@/models/MilestoneManager";
import { StatsManager } from "@/models/StatsManager";
import { MilestoneTag } from "@/shared/Milestones";
import { bindEvent } from "@/shared/utils/busUtils";
import { GameContext } from "@/core/GameContext";

export class AreaManager extends Destroyable {
    private readonly statsManager = StatsManager.instance;
    private readonly allAreas: AreaSpec[];
    private context: GameContext;

    constructor() {
        super();
        this.allAreas = Array.from(Area.specById.values());
        this.context = GameContext.getInstance();

        this.checkAllUnlocks();
        bindEvent(this.eventBindings, "milestone:achieved", () => this.checkAllUnlocks());
        bindEvent(this.eventBindings, "game:gameLoaded", () => this.checkAllUnlocks());
        bindEvent(this.eventBindings, "hunt:bossKill", ({ areaId }) => this.checkOutpostAvailability(areaId));
    }

    private checkAllUnlocks() {
        // Your existing area unlock logic
        if (debugManager.get("hunt_allAreasOpen")) {
            for (const spec of this.allAreas) {
                this.statsManager.unlockArea(spec.id);
            }
            return;
        }

        for (const spec of this.allAreas) {
            const reqs: MilestoneTag[] = (spec.requires as MilestoneTag[]) || [];
            const currentStats = this.statsManager.getAreaStats(spec.id);

            // Check conditions but let StatsManager store the result
            if (!currentStats.areaUnlocked && MilestoneManager.instance.hasAll(reqs)) {
                this.statsManager.unlockArea(spec.id);
                printLog(`Area unlocked: ${spec.id} using Milestone Tags - ${reqs}`, 2, "AreaManager.ts");
            }
        }

        // Check all areas for outpost availability
        this.checkAllOutpostAvailability();
    }

    /**
     * Check if an outpost can be built in a specific area
     */
    private checkOutpostAvailability(areaId: string) {
        const areaStats = this.statsManager.getAreaStats(areaId);
        const settlement = this.context.settlement;

        // Skip if not unlocked or already has outpost
        if (!this.statsManager.getAreaStats(areaId).areaUnlocked || settlement.hasOutpost(areaId)) {
            return;
        }

        // Check if requirements are met (e.g., 10 boss kills)
        if (areaStats.bossKillsTotal >= 10) {
            const areaSpec = this.allAreas.find((area) => area.id === areaId);

            // Notify settlement that this outpost is available
            bus.emit("outpost:available", {
                areaId: areaId,
                areaName: areaSpec?.displayName || areaId,
            });

            printLog(`Outpost available in: ${areaSpec?.displayName}`, 2, "AreaManager.ts");
        }
    }

    /**
     * Check all areas for outpost availability
     */
    private checkAllOutpostAvailability() {
        for (const spec of this.allAreas) {
            if (this.statsManager.getAreaStats(spec.id).areaUnlocked) {
                this.checkOutpostAvailability(spec.id);
            }
        }
    }

    /**
     * Get area modifiers (including outpost bonuses)
     */
    public getAreaModifiers(areaId: string) {
        // Ask settlement for any outpost modifiers
        return this.context.settlement.getAreaModifiers(areaId);
    }

    /**
     * Check if player meets requirements to skip this area
     */
    public canSkipArea(areaId: string): boolean {
        const modifiers = this.getAreaModifiers(areaId);
        return modifiers.canSkipArea;
    }

    /**
     * Get adjusted boss unlock requirement
     */
    public getBossUnlockRequirement(areaId: string): number {
        const modifiers = this.getAreaModifiers(areaId);
        return modifiers.killsToUnlockBoss;
    }

    // Existing methods remain unchanged...
    public getUnlockedAreas(): AreaSpec[] {
        return this.allAreas.filter((area) => {
            const stats = this.statsManager.getAreaStats(area.id);
            return stats.areaUnlocked; // ← Use this instead of this.unlocked.has()
        });
    }

    public isUnlocked(areaId: string): boolean {
        const stats = this.statsManager.getAreaStats(areaId);
        return stats?.areaUnlocked ?? false; // Safe fallback
    }

    public refresh() {
        this.checkAllUnlocks();
    }

    /**
     * Apply area modifiers to drop rates
     */
    public getAdjustedDropRate(areaId: string, baseRate: number): number {
        const modifiers = this.getAreaModifiers(areaId);
        return baseRate * modifiers.dropRateMultiplier;
    }

    /**
     * Apply area modifiers to experience
     */
    public getAdjustedExperience(areaId: string, baseExp: number): number {
        const modifiers = this.getAreaModifiers(areaId);
        return Math.floor(baseExp * modifiers.experienceMultiplier);
    }

    public destroy() {
        super.destroy();
    }
}
