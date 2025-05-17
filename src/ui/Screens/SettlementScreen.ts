import { Player } from "@/models/player";
import { BaseScreen } from "./BaseScreen";
import Markup from "./settlement.html?raw";
import { BuildingState, SettlementManager } from "@/features/settlement/SettlementManager";

export class SettlementScreen extends BaseScreen {
	readonly screenName = "settlement";
	private rootEl: HTMLElement;
	private BuildingGridEl: HTMLElement;
	private settlement: SettlementManager;

	init() {
		this.rootEl = this.addMarkuptoPage(Markup);
		this.BuildingGridEl = this.rootEl.querySelector(".building-grid") as HTMLElement;
		this.settlement = Player.getInstance().settlementManager;

		this.buildGrid();
	}

	private buildGrid() {
		for (const building of this.settlement.buildingsMap.values()) {
			this.addBuilding(building);
		}
		for (let i = 0; i < this.settlement.freePlots; i++) {
			this.addPlot();
		}
	}

	private addPlot() {
		const tmpl = this.rootEl.querySelector("#plot-card") as HTMLTemplateElement;
		if (!tmpl) return;
		const frag = tmpl.content.cloneNode(true) as DocumentFragment;
		const root = frag.firstElementChild as HTMLElement;
		if (!root) return;

		this.BuildingGridEl.appendChild(root);
	}
	private addBuilding(building: BuildingState) {
		const tmpl = this.rootEl.querySelector("#building-card") as HTMLTemplateElement;
		if (!tmpl) return;
		const frag = tmpl.content.cloneNode(true) as DocumentFragment;
		const root = frag.firstElementChild as HTMLElement;
		if (!root) return;
		const title = root.querySelector(".building-title") as HTMLElement;
		title.textContent = building.type;
		const level = root.querySelector(".building-level") as HTMLElement;
		level.textContent = building.level.toString();

		root.classList.add("building-card-built");

		this.BuildingGridEl.appendChild(root);
	}
	show() {}
	hide() {}
}
