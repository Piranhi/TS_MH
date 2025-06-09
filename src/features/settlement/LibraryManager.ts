import { bus } from "@/core/EventBus";
import { ResearchSpec, ResearchState } from "@/shared/types";
import { ResearchUpgrade } from "./ResearchUpgrade";
import { Saveable } from "@/shared/storage-types";
import { GAME_BALANCE } from "@/balance/GameBalance";

interface LibrarySaveState {
    active: ResearchUpgrade[];
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

    private handleTick(dt: number) {
        for (const upg of this.activeResearch) {
            upg.tick(dt, 1); //GAME_BALANCE.research.baseResearchSpeedMultiplier);
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
            active: Array.from(this.activeResearch),
            slots: this.unlockedSlots,
        };
    }

    load(state: LibrarySaveState): void {
        this.completedResearch = new Set(state.completed || []);
        this.activeResearch = state.active || [];
        this.unlockedSlots = state.slots;

        // …then immediately catch up any offline progress
        //this.updatePassiveRewards();
        this.emitChange();
    }
}
