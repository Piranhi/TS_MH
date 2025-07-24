import { BaseScreen } from "./BaseScreen";
import Markup from "./train.html?raw";
import { TrainedStatDisplay } from "../components/TrainedStatDisplay";
import { bindEvent } from "@/shared/utils/busUtils";

export class TrainScreen extends BaseScreen {
	readonly screenName = "train";
	private trainingListEl!: HTMLElement;
	private trainedStats: TrainedStatDisplay[] = [];

	init() {
		this.addMarkuptoPage(Markup);
		this.trainingListEl = this.byId("trained-stats-list");

		this.bindEvents();
		this.addStatElements();
	}

	protected onShow() {
		for (const trainedStat of this.trainedStats) {
			trainedStat.updateElement();
		}
	}

	protected onHide() {}

	bindEvents() {
		bindEvent(this.eventBindings, "game:gameReady", () => this.addStatElements()); // USED TO BE GAME LOADED
		bindEvent(this.eventBindings, "Game:GameTick", (dt: number) => this.handleTick(dt));
	}

	protected handleTick(dt: number) {
		if (!this.isActive) return;
		for (const trainedStat of this.trainedStats) {
			if (trainedStat.isTraining) {
				trainedStat.updateElement();
			}
		}
	}

	addStatElements() {
		this.trainingListEl.innerHTML = "";

		if (this.context.currentRun) {
			this.context.currentRun.trainedStats.stats.forEach((stat) => {
				const trainedStatDisplay = new TrainedStatDisplay(this.trainingListEl, stat);
				trainedStatDisplay.init();
				this.trainedStats.push(trainedStatDisplay);
				
			});
		}
	}
}
