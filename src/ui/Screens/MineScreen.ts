import { BaseScreen } from "./BaseScreen";
import Markup from "./mine.html?raw";
import { MineShaftDisplay } from "../components/MineShaftDisplay";
import { BuildingStatus } from "../components/BuildingStatus";
import { bindEvent } from "@/shared/utils/busUtils";

export class MineScreen extends BaseScreen {
	readonly screenName = "mine";
	private shafts: MineShaftDisplay[] = [];
	private logEl!: HTMLElement;

	init() {
		const root = this.addMarkuptoPage(Markup);
		const statusEl = root.querySelector("#mine-building-status") as HTMLElement;
		const building = this.context.settlement.getBuilding("mine");
		if (building && statusEl) new BuildingStatus(statusEl, building);
		this.build();
		this.setupTickingFeature("feature.mine", () => {
			bindEvent(this.eventBindings, "settlement:changed", () => this.syncShafts());
		});
	}

	protected onShow() {}
	protected onHide() {}

	protected handleTick(dt: number) {
		if (!this.isActive) return;
		for (const shaft of this.shafts) shaft.tick();
	}

	private syncShafts() {
		if (!this.isActive) return;
		const level = this.context.settlement.getBuilding("mine")?.level || 0;
		while (this.shafts.length < level) {
			const listEl = this.byId("mineResourceList");
			const shaft = new MineShaftDisplay(this.context.mine, this.shafts.length, listEl, (msg) => this.log(msg));
			this.shafts.push(shaft);
		}
	}

	private log(msg: string) {
		const div = document.createElement("div");
		div.textContent = msg;
		this.logEl.appendChild(div);
	}

	private build() {
		const listEl = this.byId("mineResourceList");
		listEl.innerHTML = "";
		this.logEl = this.byId("mineOutput");
		this.logEl.innerHTML = "";
		this.syncShafts();
	}
}
