import { AreaSpec } from "@/models/Area";
import { BaseScreen } from "./BaseScreen";
import Markup from "./outposts.html?raw";
import { AreaStats } from "@/shared/stats-types";
import { bindEvent } from "@/shared/utils/busUtils";

export class OutpostsScreen extends BaseScreen {
    readonly screenName = "outposts";
    private outpostsPanel!: HTMLElement;

    init() {
        this.addMarkuptoPage(Markup);
        this.outpostsPanel = this.$(".outposts-panel");
        this.bindToEvents();
    }
    show() {
        this.populate();
    }
    hide() {}

    bindToEvents() {
        bindEvent(this.eventBindings, "stats:areaStatsChanged", () => {
            this.populate();
        });
    }

    populate() {
        this.outpostsPanel.innerHTML = ""; // Clear existing content
        const areaManager = this.context.currentRun?.huntManager.areaManager;
        const statsManager = this.context.services.statsManager;
        const unlockedAreas = areaManager?.getUnlockedAreas();
        unlockedAreas?.forEach((areaSpec: AreaSpec) => {
            const stats = statsManager.getAreaStats(areaSpec.id);
            this.outpostsPanel.appendChild(this.createRow(areaSpec, stats));
        });
    }

    // Create outpost row element
    createRow(area: AreaSpec, stats: AreaStats): HTMLElement {
        const kills = stats.bossKillsTotal || 0; // Use total boss kills from stats

        const rowEl = document.createElement("div");
        rowEl.classList.add("outpost-row");

        const nameEl = document.createElement("div");
        nameEl.classList.add("outpost-name");
        nameEl.textContent = area.displayName;

        const levelEl = document.createElement("div");
        levelEl.className = "outpost-level";
        levelEl.textContent = "1";

        const statusEl = document.createElement("div");
        statusEl.classList.add("outpost-status");
        if (kills < 10) {
            statusEl.classList.add("locked");
            statusEl.textContent = "Locked";
        } else if (kills >= 10 && kills < 20) {
            statusEl.classList.add("active");
            statusEl.textContent = "Active";
        } else {
            statusEl.classList.add("skippable");
            statusEl.textContent = "Skippable";
        }

        const bosskillsEl = document.createElement("div");
        bosskillsEl.classList.add("outpost-kills");
        bosskillsEl.textContent = `${kills}/10`; // Placeholder for boss kills

        rowEl.appendChild(nameEl);
        rowEl.appendChild(levelEl);
        rowEl.appendChild(statusEl);
        rowEl.appendChild(bosskillsEl);

        return rowEl;
    }
}
