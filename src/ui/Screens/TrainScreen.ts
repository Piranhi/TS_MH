import { BaseScreen } from "./BaseScreen";
import Markup from "./train.html?raw";
import { Player } from "@/models/player";
import { TrainedStatDisplay } from "../components/TrainedStatDisplay";
import { bindEvent } from "@/shared/utils/busUtils";

export class TrainScreen extends BaseScreen {
	readonly screenName = "train";
	private rootEl!: HTMLElement;
	private trainingListEl!: HTMLElement;

	init() {
		this.rootEl = this.addMarkuptoPage(Markup);
		this.trainingListEl = document.getElementById("trained-stats-list") as HTMLElement;
		this.bindEvents();
		this.addStatElements();
	}

	show() {}
	hide() {}
	bindEvents() {
		bindEvent(this.eventBindings, "Game:UITick", (dt) => this.handleTick(dt));
		bindEvent(this.eventBindings, "game:gameReady", () => this.addStatElements()); // USED TO BE GAME LOADED
	}

	handleTick(dt: number) {}

	addStatElements() {
		this.trainingListEl.innerHTML = "";
		Player.getInstance().trainedStatManager?.stats.forEach((stat) => {
			const statHolder = new TrainedStatDisplay(this.rootEl, this.trainingListEl, stat);
			statHolder.init();
		});
	}
}
