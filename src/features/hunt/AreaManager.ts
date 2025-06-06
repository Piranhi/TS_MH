// AreaManager.ts - Updated to work with your existing structure
import { debugManager, printLog } from "@/core/DebugManager";
import { bus } from "@/core/EventBus";
import { Area, AreaSpec } from "@/models/Area";
import { Destroyable } from "@/models/Destroyable";
import { MilestoneManager } from "@/models/MilestoneManager";
import { StatsManager } from "@/models/StatsManager";
import { MilestoneTag } from "@/shared/Milestones";
import { bindEvent } from "@/shared/utils/busUtils";

export class AreaManager extends Destroyable {
    private readonly statsManager = StatsManager.instance;

    private readonly allAreas: AreaSpec[];
    private unlocked = new Set<string>();

    // ✅ NEW: Outpost tracking
    private availableOutposts = new Set<string>();
    private builtOutposts = new Set<string>();

    constructor() {
        super();
        this.allAreas = Array.from(Area.specById.values());

        this.checkAllUnlocks();
        bindEvent(this.eventBindings, "milestone:achieved", () => this.checkAllUnlocks());
        bindEvent(this.eventBindings, "game:gameLoaded", () => this.checkAllUnlocks());

        // ✅ NEW: Check outposts when boss is killed (completing an area)
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

        // ✅ NEW: Check outposts after area unlocks
        this.checkOutpostUnlocks();
    }

    // ✅ NEW: Outpost checking method
    private checkOutpostUnlocks() {
        for (const spec of this.allAreas) {
            // Skip if already available or built
            if (this.availableOutposts.has(spec.id) || this.builtOutposts.has(spec.id)) {
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

    // ✅ CORRECTED: Uses your existing AreaStats fields
    private canBuildOutpost(areaId: string): boolean {
        const areaStats = this.statsManager.getAreaStats(areaId);

        return (
            this.unlocked.has(areaId) && // Area must be unlocked
            areaStats.bossKillsTotal >= 10 // Boss killed 10+ times (area "completed")
        );
    }

    // ✅ NEW: Build outpost method
    public buildOutpost(areaId: string): boolean {
        if (!this.availableOutposts.has(areaId)) {
            console.warn(`Outpost not available for area: ${areaId}`);
            return false;
        }

        // Move from available to built
        this.availableOutposts.delete(areaId);
        this.builtOutposts.add(areaId);

        const areaSpec = this.allAreas.find((area) => area.id === areaId);

        // ✅ Trigger milestone for other systems
        MilestoneManager.instance.processPersistent("outpost-built", areaId, {
            areaName: areaSpec?.displayName,
        });

        // ✅ Emit specific outpost event
        bus.emit("outpost:built", {
            areaId: areaId,
            areaName: areaSpec?.displayName,
        });

        printLog(`Outpost built in: ${areaSpec?.displayName}`, 2, "AreaManager.ts");
        return true;
    }

    // ✅ NEW: Public API methods
    public getAvailableOutposts(): string[] {
        return Array.from(this.availableOutposts);
    }

    public getBuiltOutposts(): string[] {
        return Array.from(this.builtOutposts);
    }

    public hasOutpost(areaId: string): boolean {
        return this.builtOutposts.has(areaId);
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
}
