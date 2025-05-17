import { Player } from "@/models/player";
import { BaseScreen } from "./BaseScreen";
import Markup from "./settlement.html?raw";
import { SettlementManager } from "@/features/settlement/SettlementManager";
import { bus } from "@/core/EventBus";
import { BuildingDisplay } from "../components/BuildingDisplay";

export class SettlementScreen extends BaseScreen {
	readonly screenName = "settlement";
	private rootEl!: HTMLElement;
	private BuildingGridEl!: HTMLElement;
	private settlement!: SettlementManager;
	private buildingDisplays: BuildingDisplay[] = [];
	private buildingTemplate!: HTMLTemplateElement;
	private plotTemplate!: HTMLTemplateElement;

	init() {
		this.rootEl = this.addMarkuptoPage(Markup);
		this.BuildingGridEl = this.rootEl.querySelector(".building-grid") as HTMLElement;
		this.settlement = Player.getInstance().settlementManager;
		this.buildingTemplate = this.rootEl.querySelector("#building-card") as HTMLTemplateElement;
		this.plotTemplate = this.rootEl.querySelector("#plot-card") as HTMLTemplateElement;

		this.buildGrid();
		bus.on("settlement:changed", () => this.buildGrid());
	}

	private buildGrid() {
		this.BuildingGridEl.innerHTML = "";
		this.buildingDisplays = [];

		for (const building of this.settlement.getAllBuildings()) {
			const display = new BuildingDisplay(this.BuildingGridEl, this.buildingTemplate, building);
			this.buildingDisplays.push(display);
		}
		for (let i = 0; i < this.settlement.getFreePlots(); i++) {
			const display = new BuildingDisplay(this.BuildingGridEl, this.plotTemplate);
			this.buildingDisplays.push(display);
		}
	}

	show() {}
	hide() {}
}
