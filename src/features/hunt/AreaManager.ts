import { debugManager, printLog } from "@/core/DebugManager";
import { bus } from "@/core/EventBus";
import { Area, AreaSpec } from "@/models/Area";
import { Destroyable } from "@/models/Destroyable";
import { MilestoneManager } from "@/models/MilestoneManager";
import { MilestoneTag } from "@/shared/Milestones";
import { bindEvent } from "@/shared/utils/busUtils";

export class AreaManager extends Destroyable {
	private readonly allAreas: AreaSpec[];
	private unlocked = new Set<string>();

	constructor() {
		super();
		this.allAreas = Array.from(Area.specById.values());

		this.checkAllUnlocks();
		bindEvent(this.eventBindings, "milestone:achieved", () => this.checkAllUnlocks());
		bindEvent(this.eventBindings, "game:gameLoaded", () => this.checkAllUnlocks());
	}

	private checkAllUnlocks() {
		if (debugManager.get("hunt_allAreasOpen")) {
		}
		for (const spec of this.allAreas) {
			// DEBUG - SET ALL AREAS TO OPEN
			if (debugManager.get("hunt_allAreasOpen")) {
				this.unlocked.add(spec.id);
				continue;
			}
			const reqs: MilestoneTag[] = (spec.requires as MilestoneTag[]) || [];
			if (!this.unlocked.has(spec.id) && MilestoneManager.instance.hasAll(reqs)) {
				this.unlocked.add(spec.id);
				bus.emit("hunt:areaUnlocked", spec.id);
				printLog(`Area unlocked: ${spec.id} using Milestone Tags - ${reqs}`, 2, "AreaManager.ts");
				console.log();
			}
		}
	}

	private handlePrestige() {}

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
