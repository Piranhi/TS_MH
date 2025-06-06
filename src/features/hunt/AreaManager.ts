// AreaManager.ts - Updated to work with Outpost class
import { debugManager, printLog } from "@/core/DebugManager";
import { bus } from "@/core/EventBus";
import { Area, AreaSpec } from "@/models/Area";
import { Destroyable } from "@/models/Destroyable";
import { MilestoneManager } from "@/models/MilestoneManager";
import { StatsManager } from "@/models/StatsManager";
import { MilestoneTag } from "@/shared/Milestones";
import { bindEvent } from "@/shared/utils/busUtils";
import { Outpost } from "./Outpost";
import { OutpostSpec } from "@/shared/types";

export class AreaManager extends Destroyable {
    private readonly statsManager = StatsManager.instance;

    private readonly allAreas: AreaSpec[];
    private unlocked = new Set<string>();

    // ✅ UPDATED: Outpost management
    private outposts = new Map<string, Outpost>();
    private availableOutposts = new Set<string>();

    constructor() {
        super();
        this.allAreas = Array.from(Area.specById.values());

        this.checkAllUnlocks();
        bindEvent(this.eventBindings, "milestone:achieved", () => this.checkAllUnlocks());
        bindEvent(this.eventBindings, "game:gameLoaded", () => this.checkAllUnlocks());
        bindEvent(this.eventBindings, "hunt:bossKill", () => this.checkOutpostUnlocks());
    }

    private checkAllUnlocks() {
        // Your existing area unlock logic
        if (debugManager.get("hunt_allAreasOpen")) {
            for (const spec of this.allAreas) {
                this.unlocked.add(spec.id);
            }
            return;
        }

        for (const spec of this.allAreas) {
            const reqs: MilestoneTag[] = (spec.requires as MilestoneTag[]) || [];
            if (!this.unlocked.has(spec.id) && MilestoneManager.instance.hasAll(reqs)) {
                this.unlocked.add(spec.id);
                bus.emit("hunt:areaUnlocked", spec.id);
                printLog(`Area unlocked: ${spec.id} using Milestone Tags - ${reqs}`, 2, "AreaManager.ts");
            }
        }

        this.checkOutpostUnlocks();
    }

    private checkOutpostUnlocks() {
        for (const spec of this.allAreas) {
            // Skip if already available or built
            if (this.availableOutposts.has(spec.id) || this.hasOutpost(spec.id)) {
                continue;
            }

            if (this.canBuildOutpost(spec.id)) {
                this.availableOutposts.add(spec.id);

                bus.emit("outpost:available", {
                    areaId: spec.id,
                    areaName: spec.displayName,
                });

                printLog(`Outpost available in: ${spec.displayName}`, 2, "AreaManager.ts");
            }
        }
    }

    private canBuildOutpost(areaId: string): boolean {
        const areaStats = this.statsManager.getAreaStats(areaId);

        return this.unlocked.has(areaId) && areaStats.bossKillsTotal >= 10;
    }

    // ✅ UPDATED: Build outpost method
    public buildOutpost(areaId: string): boolean {
        if (!this.availableOutposts.has(areaId)) {
            console.warn(`Outpost not available for area: ${areaId}`);
            return false;
        }

        // ✅ Get outpost spec and create instance
        const outpostSpec = this.getOutpostSpec(areaId);
        if (!outpostSpec) {
            console.error(`No outpost spec found for area: ${areaId}`);
            return false;
        }

        const outpost = Outpost.create(outpostSpec);
        this.outposts.set(areaId, outpost);

        // Remove from available (now built)
        this.availableOutposts.delete(areaId);

        const areaSpec = this.allAreas.find((area) => area.id === areaId);

        // ✅ Trigger milestone for other systems
        MilestoneManager.instance.processPersistent("outpost-built", areaId, {
            areaName: areaSpec?.displayName,
        });

        // ✅ Emit specific outpost event
        bus.emit("outpost:built", {
            areaId: areaId,
            areaName: areaSpec?.displayName,
            outpost: outpost,
        });

        printLog(`Outpost built in: ${areaSpec?.displayName}`, 2, "AreaManager.ts");
        return true;
    }

    // ✅ NEW: Get outpost spec for an area
    private getOutpostSpec(areaId: string): OutpostSpec | null {
        // Option 1: Get from Outpost registry (like your other specs)
        return Outpost.getSpec(areaId) ?? null;

        // Option 2: Generate dynamically based on area
        // const areaSpec = this.allAreas.find(area => area.id === areaId);
        // return this.generateOutpostSpec(areaSpec);
    }

    // ✅ UPDATED: API methods for Outpost instances
    public getAvailableOutposts(): string[] {
        return Array.from(this.availableOutposts);
    }

    public getBuiltOutposts(): string[] {
        return Array.from(this.outposts.keys());
    }

    public hasOutpost(areaId: string): boolean {
        return this.outposts.has(areaId);
    }

    public getOutpost(areaId: string): Outpost | undefined {
        return this.outposts.get(areaId);
    }

    public canPlayerBuildOutpost(areaId: string): boolean {
        return this.availableOutposts.has(areaId);
    }

    // Your existing methods remain unchanged...
    public getUnlockedAreas(): AreaSpec[] {
        return this.allAreas.filter((a) => this.unlocked.has(a.id));
    }

    public isUnlocked(areaId: string): boolean {
        return this.unlocked.has(areaId);
    }

    public refresh() {
        this.checkAllUnlocks();
    }

    public destroy() {
        super.destroy();
        // ✅ Clean up outpost instances
        for (const outpost of this.outposts.values()) {
            outpost.destroy();
        }
        this.outposts.clear();
    }
}
