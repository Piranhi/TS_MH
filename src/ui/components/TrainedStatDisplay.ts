import { TrainedStatStatus } from "@/models/Stats";
import { TrainedStat } from "@/models/TrainedStat";
import { TrainedStatManager } from "@/models/TrainedStatManager";
import { Player } from "@/models/player";
import { UIBase } from "./UIBase";
import { bindEvent } from "@/shared/utils/busUtils";
import { ProgressBar } from "./ProgressBar";

interface UnlockedEls {
	progressBar: ProgressBar;
	progressText: HTMLElement;
	assigned: HTMLElement;
	level: HTMLElement;
	name: HTMLElement;
	image: HTMLImageElement;
}

export class TrainedStatDisplay extends UIBase {
	private els?: UnlockedEls;
	private manager!: TrainedStatManager;

	constructor(private root: HTMLElement, private trainingListEl: HTMLElement, private trainedStat: TrainedStat) {
		super();
	}

	public init() {
		this.createAndBuild();
		bindEvent(this.eventBindings, "Game:GameTick", () => this.updateElement());
		this.manager = Player.getInstance().trainedStatManager!;
	}

	private createAndBuild() {
		const templates: Record<TrainedStatStatus, HTMLTemplateElement | null> = {
			Unlocked: this.root.querySelector("#training-item-unlocked") as HTMLTemplateElement,
			Locked: this.root.querySelector("#training-item-locked") as HTMLTemplateElement,
			Hidden: null,
		};
		const tmpl = templates[this.trainedStat.status];
		if (!tmpl) return;

		const frag = tmpl.content.cloneNode(true) as DocumentFragment;
		this.element = frag.firstElementChild as HTMLElement;
		this.element.dataset.key = this.trainedStat.id;

		this.attachTo(this.trainingListEl);
		if (this.trainedStat.status === "Unlocked") {
			this.setupUnlocked();
		} else {
			this.setupLocked();
		}
	}

	private setupUnlocked() {
		const progressText = document.createElement("div");
		progressText.className = "progress-text";
		this.$(".training-bar").appendChild(progressText);
		const progressBar = new ProgressBar({
			container: this.$(".training-bar"),
			initialValue: this.trainedStat.progress,
			maxValue: this.trainedStat.nextThreshold,
		});

		this.els = {
			progressBar: progressBar,
			progressText: progressText,
			assigned: this.$(".training-assigned"),
			level: this.$(".training-level"),
			name: this.$(".training-name"),
			image: this.$(".training-icon img") as HTMLImageElement,
		};
		this.bindDomEvent(this.$(".control-button.plus"), "click", () => this.adjustAmount(1));
		this.bindDomEvent(this.$(".control-button.minus"), "click", () => this.adjustAmount(-1));

		this.els.image.alt = this.trainedStat.name;

		this.updateElement();
	}

	private setupLocked() {}

	private updateElement() {
		if (this.trainedStat.status !== "Unlocked") return;

		const { progressBar, progressText, assigned, level, name } = this.els!;
		name.textContent = this.trainedStat.name;
		level.textContent = `Lvl ${this.trainedStat.level}`;
		assigned.textContent = String(this.trainedStat.assignedPoints);
		progressBar.setValue(this.trainedStat.progress);
		progressBar.setMax(this.trainedStat.nextThreshold);

		progressText.textContent = `${Math.floor(this.trainedStat.progress)} / ${this.trainedStat.nextThreshold}`;
	}

	private adjustAmount(delta: number) {
		this.manager.allocateTrainedStat(this.trainedStat.id, delta);
	}
}
