import { bus } from "@/core/EventBus";
import { ResearchUpgrade } from "./ResearchUpgrade";
import { Saveable } from "@/shared/storage-types";
import { OfflineProgressHandler } from "@/models/OfflineProgress";
import { GameContext } from "@/core/GameContext";
import { GameBase } from "@/core/GameBase";

interface LibrarySaveState {
	active: any[];
	levels: Record<string, number>;
	slots: number;
}

export class LibraryManager extends GameBase implements Saveable, OfflineProgressHandler {
	private researchMap = new Map<string, ResearchUpgrade>();
	private activeResearch: ResearchUpgrade[] = [];
	private completedResearch = new Set<string>();
	private unlockedSlots = 1;

	constructor() {
		super();
		this.setupTickingFeature("feature.library", () => {});
		this.initResearch();
	}

	protected handleTick(dt: number) {
		if (!this.isFeatureActive()) return;
		const finished: ResearchUpgrade[] = [];
		for (const upgrade of this.activeResearch) {
			const done = upgrade.tick(dt, GameContext.getInstance().modifiers.getValue("researchSpeed"));
			if (done) {
				if (upgrade.unlocked) this.handleResearchComplete(upgrade);
				finished.push(upgrade);
			}
		}
		if (finished.length > 0) {
			this.activeResearch = this.activeResearch.filter((u) => !finished.includes(u));
			bus.emit("library:changed");
		}
	}

	handleOfflineProgress(offlineSeconds: number): null {
		if (!this.isFeatureActive()) return null;
		this.handleTick(offlineSeconds);
		return null;
	}

	private initResearch() {
		const specs = ResearchUpgrade.getAllSpecs();
		specs.forEach((s) => {
			const upgrade = ResearchUpgrade.create(s.id);
			this.researchMap.set(s.id, upgrade);
		});
	}

	startResearch(id: string) {
		const upgrade = this.researchMap.get(id);
		if (!upgrade || upgrade.unlocked) return;
		if (this.activeResearch.length >= this.unlockedSlots) return;
		if (this.activeResearch.includes(upgrade)) return;
		this.activeResearch.push(upgrade);
		bus.emit("library:changed");
	}

	private handleResearchComplete(upgrade: ResearchUpgrade) {
		this.completedResearch.add(upgrade.id);
		bus.emit("library:changed");
	}

	private emitChange() {}

	getActive() {
		return this.activeResearch;
	}

	getAvailable() {
		return [...this.researchMap.values()].filter((u) => !u.unlocked && !this.activeResearch.includes(u));
	}

	getCompleted() {
		return [...this.completedResearch];
	}

	getResearchSpeed() {
		return GameContext.getInstance().modifiers.getValue("researchSpeed");
	}

	// ----------------------- SAVE LOAD -------------------------------
	save(): LibrarySaveState {
		const levels: Record<string, number> = {};
		this.researchMap.forEach((upg, id) => {
			levels[id] = upg.level;
		});
		return {
			active: this.activeResearch.map((upg) => upg.toJSON()),
			levels,
			slots: this.unlockedSlots,
		};
	}

	load(state: LibrarySaveState): void {
		this.unlockedSlots = state.slots || 1;
		Object.entries(state.levels || {}).forEach(([id, lvl]) => {
			const upg = this.researchMap.get(id);
			if (upg) upg.setLevel(lvl);
			if (upg && upg.unlocked) this.completedResearch.add(id);
		});

		// Reconstruct with preserved state using fromJSON()
		this.activeResearch = (state.active || [])
			.map((serialized) => {
				try {
					return ResearchUpgrade.fromJSON(serialized);
				} catch (e) {
					console.warn("Failed to load research:", e);
					return undefined;
				}
			})
			.filter((upg): upg is ResearchUpgrade => upg !== undefined);

		// …then immediately catch up any offline progress
		//this.updatePassiveRewards();
		this.emitChange();
	}
}
