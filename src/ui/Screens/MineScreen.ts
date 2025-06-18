import { BaseScreen } from "./BaseScreen";
import Markup from "./mine.html?raw";
import { bus } from "@/core/EventBus";
import { MineShaft } from "../components/MineShaft";
import { BuildingStatus } from "../components/BuildingStatus";

export class MineScreen extends BaseScreen {
	readonly screenName = "mine";
	private shafts: MineShaft[] = [];
	private logEl!: HTMLElement;

        init() {
                const root = this.addMarkuptoPage(Markup);
                const statusEl = root.querySelector("#mine-building-status") as HTMLElement;
                const building = this.context.settlement.getBuilding("mine");
                if (building && statusEl) new BuildingStatus(statusEl, building);
                this.build();
                bus.on("Game:UITick", () => this.update());
                bus.on("settlement:changed", () => this.syncShafts());
	}

	show() {}
	hide() {}

	update() {
		for (const shaft of this.shafts) shaft.tick();
	}

	private syncShafts() {
		const level = this.context.settlement.getBuilding("mine")?.level || 0;
		while (this.shafts.length < level) {
			const listEl = this.byId("mineResourceList");
			const shaft = new MineShaft(this.context.mine, this.shafts.length, listEl, (msg) => this.log(msg));
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
