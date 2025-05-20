import { Player } from "@/models/player";
import { BaseScreen } from "./BaseScreen";
import Markup from "./settlement.html?raw";
import { SettlementManager } from "@/features/settlement/SettlementManager";
import { BuildingDisplay } from "../components/BuildingDisplay";
import { bindEvent } from "@/shared/utils/busUtils";
import { PlotDisplay } from "../components/PlotDisplay";

export interface BuildingGridItem {
    id: string;
    type: "plot" | "building";
}

export class SettlementScreen extends BaseScreen {
    readonly screenName = "settlement";
    private rootEl!: HTMLElement;
    private BuildingGridEl!: HTMLElement;
    private settlement!: SettlementManager;
    private buildingDisplays: BuildingGridItem[] = [];
    private buildingTemplate!: HTMLTemplateElement;
    private plotTemplate!: HTMLTemplateElement;

    private settlementRewardInfo!: HTMLElement;
    private settlementTimeInfo!: HTMLElement;
    private settlementPassiveProgressEl!: HTMLElement;

    init() {
        this.rootEl = this.addMarkuptoPage(Markup);
        this.BuildingGridEl = this.rootEl.querySelector(".building-grid") as HTMLElement;
        this.settlement = Player.getInstance().settlementManager;
        this.buildingTemplate = this.rootEl.querySelector("#building-card") as HTMLTemplateElement;
        this.plotTemplate = this.rootEl.querySelector("#plot-card") as HTMLTemplateElement;
        this.settlementRewardInfo = this.rootEl.querySelector("#settlement-reward-info") as HTMLElement;
        this.settlementTimeInfo = this.rootEl.querySelector("#settlement-time-info") as HTMLElement;
        this.settlementPassiveProgressEl = this.rootEl.querySelector(".progress") as HTMLElement;

        this.buildGrid();
        this.bindEvents();
    }

    private buildGrid() {
        this.BuildingGridEl.innerHTML = "";
        this.buildingDisplays = [];

		for (const building of this.settlement.getAllBuildings()) {
			const display = new BuildingDisplay(this.BuildingGridEl, this.buildingTemplate, building);
			this.buildingDisplays.push(display);
		}
	}

    show() {}
    hide() {}
    bindEvents() {
        bindEvent(this.eventBindings, "settlement:changed", () => this.buildGrid());
        bindEvent(this.eventBindings, "Game:UITick", (delta) => this.handleTick(delta));
    }

    private handleTick(delta: number) {
        const snapshot = Player.getInstance().settlementManager.rewardSnapshot();
        this.settlementRewardInfo.textContent = "x " + snapshot.reward;
        if (snapshot.reward === snapshot.max) {
            this.settlementTimeInfo.textContent = "Max Passive Rewards";
        } else {
            const timeDiff = snapshot.nextUnlock - Date.now(); // snapshot.progressStart;
            this.settlementTimeInfo.textContent = `Next passive reward in: ${this.formatTime(timeDiff)}`;
        }
        const now = Date.now();
        const total = snapshot.nextUnlock - snapshot.progressStart;
        const elapsed = now - snapshot.progressStart;

        let percent = 0;
        if (total > 0) {
            percent = Math.max(0, Math.min(1, elapsed / total));
        }
        //console.log(percent);
        this.settlementPassiveProgressEl.style.width = `${Math.round(percent * 100)}%`;
    }

    private formatTime(ms: number): string {
        let totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        // Pad minutes and seconds with leading zero if needed
        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    }
}
