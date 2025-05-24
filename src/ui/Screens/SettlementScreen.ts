import { Player } from "@/core/Player";
import { BaseScreen } from "./BaseScreen";
import Markup from "./settlement.html?raw";
import { SettlementManager } from "@/features/settlement/SettlementManager";
import { BuildingDisplay } from "../components/BuildingDisplay";
import { bindEvent } from "@/shared/utils/busUtils";

export class SettlementScreen extends BaseScreen {
	readonly screenName = "settlement";
	private rootEl!: HTMLElement;
	private BuildingGridEl!: HTMLElement;
	private buildingDisplays: BuildingDisplay[] = [];
	private buildingTemplate!: HTMLTemplateElement;
	private settlementBuildPointsEl!: HTMLElement;

	private settlementRewardInfo!: HTMLElement;
	private settlementTimeInfo!: HTMLElement;
	private settlementPassiveProgressEl!: HTMLElement;

	init() {
		this.rootEl = this.addMarkuptoPage(Markup);
		this.BuildingGridEl = this.rootEl.querySelector(".building-grid") as HTMLElement;
		this.buildingTemplate = this.rootEl.querySelector("#building-card") as HTMLTemplateElement;
		this.settlementRewardInfo = this.rootEl.querySelector("#settlement-reward-info") as HTMLElement;
		this.settlementTimeInfo = this.rootEl.querySelector("#settlement-time-info") as HTMLElement;
		this.settlementPassiveProgressEl = this.rootEl.querySelector(".progress") as HTMLElement;
		this.settlementBuildPointsEl = this.byId("settlement-build-points");

		this.bindEvents();
	}

	show() {
		this.buildGrid();
		this.pointsChanged(this.context.settlement.totalBuildPoints);
	}

	hide() {}

	bindEvents() {
		bindEvent(this.eventBindings, "settlement:buildPointsChanged", (amt) => this.pointsChanged(amt));
		bindEvent(this.eventBindings, "settlement:changed", () => this.buildGrid());
		bindEvent(this.eventBindings, "Game:UITick", (delta) => this.handleTick(delta));
	}

	private buildGrid() {
		this.BuildingGridEl.innerHTML = "";
		this.buildingDisplays = [];

		for (const building of this.context.settlement.getAllBuildings()) {
			const display = new BuildingDisplay(this.BuildingGridEl, this.buildingTemplate, building);
			this.buildingDisplays.push(display);
		}
	}

	private handleTick(delta: number) {
		const snapshot = this.context.settlement.getPassiveSnapshot();

		this.settlementRewardInfo.textContent = `${snapshot.earnedPoints} build points on Prestige - x ${(1 + snapshot.reward).toFixed(
			1
		)} construction bonus`;

		if (snapshot.reward >= snapshot.max) {
			// at cap: show a “max” message and fill the bar completely
			this.settlementTimeInfo.textContent = "Max Passive Rewards";
			this.settlementPassiveProgressEl.style.width = "100%";
		} else {
			// otherwise, we still have progress toward the next chunk
			// snapshot.timeToNext is already “ms remaining”
			this.settlementTimeInfo.textContent = `Next passive reward in: ${this.formatTime(snapshot.timeToNext)}`;

			// snapshot.progress is a 0→1 fraction toward the next reward
			const percent = Math.min(Math.max(snapshot.progress, 0), 1);
			this.settlementPassiveProgressEl.style.width = `${Math.round(percent * 100)}%`;
		}
	}

	private pointsChanged(amt: number) {
		this.settlementBuildPointsEl.textContent = `Build Points: ${amt}`;
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
