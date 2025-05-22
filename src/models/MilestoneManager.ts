import { printLog } from "@/core/DebugManager";
import { bus, GameEvents } from "@/core/EventBus";
import { MilestoneEventPayload, MilestoneMeta, MilestoneTag, ProgressionEvent } from "@/shared/Milestones";
import { Saveable } from "@/shared/storage-types";
import { ProgressionTrigger } from "@/shared/types";

interface MilestoneSaveState {
	persistentTags: MilestoneTag[];
	runTags: MilestoneTag[];
}

export class MilestoneManager implements Saveable {
	private triggerMap = new Map<string, MilestoneTag[]>();
	private runMilestones = new Set<MilestoneTag>();
	private persistentMilestones = new Set<MilestoneTag>();

	/** singleton */
	static instance = new MilestoneManager();

	private constructor() {
		bus.on("game:prestigePrep", () => this.runMilestones.clear());
		bus.on("hunt:areaKill", ({ enemyId }) => this.processRun("monster-killed", enemyId));
		//bus.on("building-built", (entityId: string, meta?: any) => this.processRun("building-built", entityId, meta));
		//bus.on("hunt:bossKill", (entityId: string, meta?: any) => this.processRun("boss-defeated", entityId));
	}

	registerSpecs(triggers: ProgressionTrigger[]) {
		triggers.forEach(({ event, id, unlocks }) => this.triggerMap.set(`${event}|${id}`, unlocks));
	}

	processRun(event: ProgressionEvent, entityId: string, meta?: MilestoneMeta) {
		this.process(this.runMilestones, event, entityId, meta);
	}
	processPersistent(event: ProgressionEvent, entityId: string, meta?: MilestoneMeta) {
		this.process(this.persistentMilestones, event, entityId, meta);
	}

	private process(bucket: Set<MilestoneTag>, event: ProgressionEvent, entityId: string, meta?: MilestoneMeta) {
		const unlocks = this.triggerMap.get(`${event}|${entityId}`);
		if (!unlocks) return;
		for (const tag of unlocks) this.addToBucket(bucket, tag, meta);
	}

	private addToBucket(bucket: Set<MilestoneTag>, tag: MilestoneTag, meta?: MilestoneMeta) {
		if (bucket.has(tag)) return;
		bucket.add(tag);

		const payload: MilestoneEventPayload = {
			tag,
			timestamp: Date.now(),
			...meta,
		};
		printLog(`Milestone added: ${tag}`, 2, "MilestoneManager.ts");
		bus.emit("milestone:achieved", payload);
	}

	has(tag: MilestoneTag): boolean {
		return this.runMilestones.has(tag) || this.persistentMilestones.has(tag);
	}
	hasAll(tags: MilestoneTag[]): boolean {
		return tags.every((t) => this.has(t));
	}

	save(): MilestoneSaveState {
		return {
			runTags: [...this.runMilestones],
			persistentTags: [...this.persistentMilestones],
		};
	}
	load(state: MilestoneSaveState) {
		this.runMilestones.clear();
		state.runTags.forEach((t) => this.runMilestones.add(t));
		this.persistentMilestones.clear();
		state.persistentTags.forEach((t) => this.persistentMilestones.add(t));
	}
}
