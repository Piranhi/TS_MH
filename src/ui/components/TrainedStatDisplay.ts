import { TrainedStatStatus } from "@/models/Stats";
import { TrainedStat } from "@/models/TrainedStat";
import { TrainedStatManager } from "@/models/TrainedStatManager";
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
		if (this.context.currentRun) {
			this.manager = this.context.currentRun?.trainedStats;
		}
	}

	public init() {
		this.createAndBuild();
		bindEvent(this.eventBindings, "Game:GameTick", () => this.updateElement());
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
			maxValue: this.trainedStat.getLevelThreshold(),
			smooth: true,
			showLabel: true,
			label: "XP",
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
		this.bindDomEvent(this.$(".control-button.zero"), "click", () => this.setToZero());
		this.bindDomEvent(this.$(".control-button.max"), "click", () => this.setToMax());
		this.bindDomEvent(this.$(".control-button.half"), "click", () => this.setToHalf());

		this.els.image.alt = this.trainedStat.name;

		this.updateElement();
	}

	private setupLocked() {}

	private updateElement() {
		if (this.trainedStat.status !== "Unlocked") return;

		const { progressBar, assigned, level, name } = this.els!;
		name.textContent = this.trainedStat.name;
		level.textContent = `Lvl ${this.trainedStat.level}`;
		assigned.textContent = `${this.trainedStat.assignedPoints}`;

		// Update progress bar to show progress toward next level
		const levelThreshold = this.trainedStat.getLevelThreshold();
		progressBar.setValue(this.trainedStat.progress);
		progressBar.setMax(levelThreshold);
		progressBar.setLabel(`${Math.floor(this.trainedStat.progress)}/${levelThreshold}`);
	}

	private adjustAmount(delta: number) {
		this.manager.allocateTrainedStat(this.trainedStat.id, delta);
	}

	private setToZero() {
		// Remove all currently allocated points for this stat
		const currentlyAllocated = this.trainedStat.assignedPoints;
		if (currentlyAllocated > 0) {
			this.adjustAmount(-currentlyAllocated);
		}
	}

	private setToMax() {
		// Allocate up to this stat's maximum, limited by available energy
		const maxPointsForThisStat = this.trainedStat.maxAssignedPoints;
		const currentlyAllocated = this.trainedStat.assignedPoints;
		const pointsNeeded = maxPointsForThisStat - currentlyAllocated;

		if (pointsNeeded > 0) {
			const availableEnergy = this.context.player.energyPool.current;
			const pointsToAllocate = Math.min(pointsNeeded, availableEnergy);
			if (pointsToAllocate > 0) {
				this.adjustAmount(pointsToAllocate);
			}
		}
	}

	private setToHalf() {
		// Try to reach half of this stat's max allocation, limited by available energy
		const targetPoints = Math.floor(this.trainedStat.maxAssignedPoints / 2);
		const currentlyAllocated = this.trainedStat.assignedPoints;
		const neededPoints = targetPoints - currentlyAllocated;

		if (neededPoints > 0) {
			// Need to allocate more points
			const availableEnergy = this.context.player.energyPool.current;
			const pointsToAllocate = Math.min(neededPoints, availableEnergy);
			if (pointsToAllocate > 0) {
				this.adjustAmount(pointsToAllocate);
			}
		} else if (neededPoints < 0) {
			// Need to remove points
			this.adjustAmount(neededPoints);
		}
		// If neededPoints === 0, we're already at the target
	}
}
