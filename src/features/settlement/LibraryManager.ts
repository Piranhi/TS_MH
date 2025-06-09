import { bus } from "@/core/EventBus";
import { ResearchSpec, ResearchState } from "@/shared/types";
import { ResearchUpgrade } from "./ResearchUpgrade";
import { Saveable } from "@/shared/storage-types";
import { GAME_BALANCE } from "@/balance/GameBalance";

interface LibrarySaveState {
	active: any[];
	completed: string[];
	slots: number;
}

export class LibraryManager implements Saveable {
	private researchMap = new Map<string, ResearchUpgrade>();
	private activeResearch: ResearchUpgrade[] = [];
	private completedResearch = new Set<string>();
	private unlockedSlots = 1;

	constructor() {
		bus.on("Game:GameTick", (dt) => this.handleTick(dt));
	}

	registerResearch(specs: ResearchSpec[]) {
		ResearchUpgrade.registerSpecs(specs);
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

	public handleTick(dt: number) {
		for (const upg of this.activeResearch) {
			upg.tick(dt, GAME_BALANCE.research.baseResearchSpeedMultiplier);
			if (upg.unlocked) {
				this.completedResearch.add(upg.id);
			}
		}
		this.activeResearch = this.activeResearch.filter((u) => !u.unlocked);
		if (this.activeResearch.length > 0) bus.emit("library:changed");
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

	// ----------------------- SAVE LOAD -------------------------------
	save(): LibrarySaveState {
		return {
			completed: Array.from(this.completedResearch),
			active: this.activeResearch.map((upg) => upg.toJSON()),
			slots: this.unlockedSlots,
		};
	}

	load(state: LibrarySaveState): void {
		this.completedResearch = new Set(state.completed || []);
		this.unlockedSlots = state.slots || 1;

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
