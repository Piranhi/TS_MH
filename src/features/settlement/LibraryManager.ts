import { bus } from "@/core/EventBus";
import { ResearchSpec } from "@/shared/types";
import { ResearchUpgrade } from "./ResearchUpgrade";

export class LibraryManager {
    private researchMap = new Map<string, ResearchUpgrade>();
    private activeResearch: ResearchUpgrade[] = [];
    private completedResearch = new Set<string>();
    private slots = 1;
    private speedMultiplier = 1;

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
        if (this.activeResearch.length >= this.slots) return;
        if (this.activeResearch.includes(upgrade)) return;
        this.activeResearch.push(upgrade);
        bus.emit("library:changed");
    }

    private handleTick(dt: number) {
        for (const upg of this.activeResearch) {
            upg.tick(dt, this.speedMultiplier);
            if (upg.unlocked) {
                this.completedResearch.add(upg.id);
            }
        }
        this.activeResearch = this.activeResearch.filter((u) => !u.unlocked);
        if (this.activeResearch.length > 0) bus.emit("library:changed");
    }

    getActive() {
        return this.activeResearch;
    }

    getAvailable() {
        return [...this.researchMap.values()].filter(
            (u) => !u.unlocked && !this.activeResearch.includes(u)
        );
    }

    getCompleted() {
        return [...this.completedResearch];
    }
}
