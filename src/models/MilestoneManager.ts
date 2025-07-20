// src/models/MilestoneManager.ts
import { printLog } from "@/core/DebugManager";
import { bus, GameEvents } from "@/core/EventBus";
import { MilestoneEventPayload, MilestoneMeta, MilestoneTag, ProgressionEvent } from "@/shared/Milestones";
import { Saveable } from "@/shared/storage-types";
import { ProgressionTrigger } from "@/shared/types";
import { Milestone } from "./Milestone";

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
		bus.on("hunt:areaKill", ({ enemyId }) => this.process("monster-killed", enemyId));
		//bus.on("building-built", (entityId: string, meta?: any) => this.process("building-built", entityId, meta));
		//bus.on("hunt:bossKill", (entityId: string, meta?: any) => this.process("boss-defeated", entityId));
	}

	/**
	 * Register progression triggers that determine when milestones are unlocked
	 */
	registerSpecs(triggers: ProgressionTrigger[]) {
		triggers.forEach(({ event, id, unlocks }) => {
			this.triggerMap.set(`${event}|${id}`, unlocks);
		});
	}

	/**
	 * Process a progression event and unlock any associated milestones
	 * Automatically routes to run/persistent buckets based on milestone spec type
	 */
	process(event: ProgressionEvent, entityId: string, meta?: MilestoneMeta) {
		const unlocks = this.triggerMap.get(`${event}|${entityId}`);
		if (!unlocks) return;

		for (const tag of unlocks) {
			this.processMilestone(tag, meta);
		}
	}

	/**
	 * Process a single milestone, routing it to the correct bucket(s) based on its type
	 */
	private processMilestone(tag: MilestoneTag, meta?: MilestoneMeta) {
		const milestoneSpec = Milestone.getSpec(tag);

		if (!milestoneSpec) {
			console.warn(`Unknown milestone: ${tag}. Make sure it's defined in milestones.json`);
			return;
		}

		switch (milestoneSpec.type) {
			case "run":
				this.addToBucket(this.runMilestones, tag, meta);
				break;

			case "persistent":
				this.addToBucket(this.persistentMilestones, tag, meta);
				break;

			case "both":
				this.addToBucket(this.runMilestones, tag, meta);
				this.addToBucket(this.persistentMilestones, tag, meta);
				break;
		}

		if (tag.startsWith("feature.")) {
			bus.emit("milestone:featureUnlocked", tag);
		}
	}

	/**
	 * Manually trigger a milestone (useful for complex conditions)
	 * @param tag The milestone to trigger
	 * @param meta Optional metadata
	 */
	triggerMilestone(tag: MilestoneTag, meta?: MilestoneMeta) {
		this.processMilestone(tag, meta);
	}

	private addToBucket(bucket: Set<MilestoneTag>, tag: MilestoneTag, meta?: MilestoneMeta) {
		if (bucket.has(tag)) return;

		bucket.add(tag);

		const payload: MilestoneEventPayload = {
			tag,
			timestamp: Date.now(),
			...meta,
		};

		printLog(`Milestone achieved: ${tag}`, 2, "MilestoneManager.ts");
		bus.emit("milestone:achieved", payload);
	}

	/**
	 * Check if a milestone has been achieved (in either run or persistent)
	 */
	has(tag: MilestoneTag): boolean {
		return this.runMilestones.has(tag) || this.persistentMilestones.has(tag);
	}

	/**
	 * Check if all specified milestones have been achieved
	 */
	hasAll(tags: MilestoneTag[]): boolean {
		return tags.every((t) => this.has(t));
	}

	/**
	 * Check if a milestone has been achieved in the current run only
	 */
	hasInRun(tag: MilestoneTag): boolean {
		return this.runMilestones.has(tag);
	}

	/**
	 * Check if a milestone has been achieved persistently
	 */
	hasPersistent(tag: MilestoneTag): boolean {
		return this.persistentMilestones.has(tag);
	}

	/**
	 * Get all run milestones
	 */
	getRunMilestones(): MilestoneTag[] {
		return Array.from(this.runMilestones);
	}

	/**
	 * Get all persistent milestones
	 */
	getPersistentMilestones(): MilestoneTag[] {
		return Array.from(this.persistentMilestones);
	}

	/**
	 * Get milestone spec and achievement status for UI display
	 */
	getMilestoneInfo(tag: MilestoneTag) {
		const spec = Milestone.getSpec(tag);
		if (!spec) return null;

		return {
			...spec,
			achievedInRun: this.hasInRun(tag),
			achievedPersistent: this.hasPersistent(tag),
			achieved: this.has(tag),
		};
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

	// DEBUG
	debugUnlockAll() {
		console.log("DEBUG: Unlocking all milestones");
		this.persistentMilestones.clear();
		this.runMilestones.clear();

		// Get all milestone specs and trigger each one
		const allMilestoneSpecs = Milestone.getAllSpecs();
		allMilestoneSpecs.forEach((spec) => {
			// Reuse the existing triggerMilestone method that handles type routing
			this.triggerMilestone(spec.id);
		});
	}
}
