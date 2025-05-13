import { BaseScreen } from "./BaseScreen";
import Markup from "./train.html?raw";
import { addHTMLtoPage } from "../utils/ScreensUtils";
import { bus } from "@/core/EventBus";
import { Player } from "@/models/player";
import { TrainedStatDisplay } from "../components/TrainedStatDisplay";

export class TrainScreen extends BaseScreen {
	readonly screenName = "train";
	private rootEl!: HTMLElement;
	private trainingListEl!: HTMLElement;

	init() {
		this.rootEl = addHTMLtoPage(Markup, this);
		this.trainingListEl = document.getElementById("trained-stats-list") as HTMLElement;
		bus.on("Game:UITick", (dt) => this.handleTick(dt));
		bus.on("game:gameLoaded", () => this.addStatElements());
		this.addStatElements();
	}

	handleTick(dt: number) {}
	show() {}
	hide() {}

	addStatElements() {
		this.trainingListEl.innerHTML = "";
		Player.getInstance().trainedStats.forEach((stat) => {
			const statHolder = new TrainedStatDisplay(this.rootEl, this.trainingListEl, stat);
			statHolder.init();
		});
	}
}
