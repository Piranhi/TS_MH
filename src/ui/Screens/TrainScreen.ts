import { BaseScreen } from "./BaseScreen";
import Markup from "./train.html?raw";
import { TrainedStatDisplay } from "../components/TrainedStatDisplay";
import { bindEvent } from "@/shared/utils/busUtils";

export class TrainScreen extends BaseScreen {
	readonly screenName = "train";
	private rootEl!: HTMLElement;
	private trainingListEl!: HTMLElement;

	init() {
		this.rootEl = this.addMarkuptoPage(Markup);
		this.trainingListEl = this.byId("trained-stats-list");

		this.bindEvents();
		this.addStatElements();
	}

	show() {}

	hide() {}

	bindEvents() {
		bindEvent(this.eventBindings, "game:gameReady", () => this.addStatElements()); // USED TO BE GAME LOADED
	}

	protected handleTick(dt: number) {
		if (!this.isFeatureActive()) return;
	}

	addStatElements() {
		this.trainingListEl.innerHTML = "";

		if (this.context.currentRun) {
			this.context.currentRun.trainedStats.stats.forEach((stat) => {
				const trainedStatDisplay = new TrainedStatDisplay(this.trainingListEl, stat);
				trainedStatDisplay.init();
			});
		}
	}
}
