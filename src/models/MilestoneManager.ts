import { printLog } from "@/core/DebugManager";
import { bus } from "@/core/EventBus";
import { MilestoneEventPayload, MilestoneTag, ProgressionEvent } from "@/shared/Milestones";
import { Saveable } from "@/shared/storage-types";
import { ProgressionTrigger } from "@/shared/types";

interface MilestoneSaveState {
	tags: MilestoneTag[];
}

export class MilestoneManager implements Saveable {
	private static _instance: MilestoneManager;
	private static triggerMap = new Map<string, MilestoneTag[]>();
	private readonly milestones = new Set<MilestoneTag>();

	constructor(initial?: MilestoneTag[]) {
		initial?.forEach((tag) => this.milestones.add(tag));
		this.bindEvents();
	}

	// Register JSON Specs
	public static registerSpecs(triggers: ProgressionTrigger[]) {
		triggers.forEach(({ event, id, unlocks }) => {
			this.triggerMap.set(`${event}|${id}`, unlocks);
		});
	}

	private bindEvents() {
		bus.on("hunt:areaKill", ({ enemyId, areaId }) => {
			this.process("monster-killed", enemyId);
		});
	}

	/** central unlock logic */
	process(event: ProgressionEvent, entityId: string, meta?: any) {
		const key = `${event}|${entityId}`;
		const unlocks = MilestoneManager.triggerMap.get(key);
		if (!unlocks) return;
		unlocks.forEach((tag) => this.add(tag, { entityId, ...meta }));
	}

	/** True if the player already earned the milestone */
	has(tag: MilestoneTag): boolean {
		return this.milestones.has(tag);
	}

	/** Add a new milestone and broadcast, merging in any extra data */
	add(tag: MilestoneTag, meta: Omit<Partial<MilestoneEventPayload>, "tag" | "timestamp"> = {}): void {
		if (this.milestones.has(tag)) return;

		this.milestones.add(tag);

		// build the full payload
		const payload: MilestoneEventPayload = {
			tag,
			timestamp: Date.now(),
			...meta, // anything extra the caller provided
		};

		printLog(`Milestone added: ${tag}`, 2, "MilestoneManager.ts");
		bus.emit("milestone:achieved", payload);
	}

	/** Convenience: check a whole list */
	hasAll(tags: MilestoneTag[]): boolean {
		return tags.every((t) => this.milestones.has(t));
	}

	static get instance(): MilestoneManager {
		if (!MilestoneManager._instance) {
			MilestoneManager._instance = new MilestoneManager();
		}
		return MilestoneManager._instance;
	}

	/** Persist / revive ------------------------------------------------------ */
	toJSON(): MilestoneTag[] {
		return [...this.milestones];
	}

	save(): MilestoneSaveState {
		return {
			tags: Array.from(this.milestones),
		};
	}

	load(state: MilestoneSaveState): void {
		this.milestones.clear();
		state.tags.forEach((tag) => this.milestones.add(tag));
		console.table(state.tags);
	}
}
