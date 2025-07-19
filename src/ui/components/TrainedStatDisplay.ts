import { TrainedStat } from "@/models/TrainedStat";
import { TrainedStatManager } from "@/models/TrainedStatManager";
import { UIBase } from "./UIBase";
import { bindEvent } from "@/shared/utils/busUtils";
import { ProgressBar } from "./ProgressBar";
import { UIButton } from "./UIButton";
import { formatNumberShort } from "@/shared/utils/stringUtils";

interface StatCardElements {
	container: HTMLElement;
	statName: HTMLElement;
	levelText: HTMLElement;
	progressBarContainer: HTMLElement;
	progressBar: ProgressBar;
	currentAllocation: HTMLElement;
	toAllocate: HTMLElement;
	controlsContainer: HTMLElement;
}

export class TrainedStatDisplay extends UIBase {
	private els!: StatCardElements;
	private manager!: TrainedStatManager;

	constructor(private root: HTMLElement, private trainedStat: TrainedStat) {
		super();
		if (this.context.currentRun) {
			this.manager = this.context.currentRun?.trainedStats;
		}
	}

	public init() {
		this.createCard();
		this.setupControls();
		bindEvent(this.eventBindings, "Game:GameTick", () => this.updateElement());
		this.updateElement();
	}

	private createCard() {
		// Copy the template: training-item-template
		const template = document.getElementById("training-item-template") as HTMLTemplateElement;
		const clone = template.content.cloneNode(true) as DocumentFragment;
		this.element = clone.firstElementChild as HTMLElement;
		this.attachTo(this.root);

		const progressBarContainer = this.element.querySelector("#training-progressbar") as HTMLElement;
		const currentAllocation = this.element.querySelector("#training-assigned") as HTMLElement;
		const toAllocate = this.element.querySelector("#training-assigned") as HTMLElement;
		const controlsContainer = this.element.querySelector("#training-controls") as HTMLElement;

		// Update the stat name
		const statName = this.element.querySelector("#training-name") as HTMLElement;
		statName.textContent = this.trainedStat.name;

		// Update the level text
		const levelText = this.element.querySelector("#training-level") as HTMLElement;
		levelText.textContent = `Lvl ${this.trainedStat.level}`;

		// Update the progress bar
		const progressBar = new ProgressBar({
			container: progressBarContainer,
			initialValue: this.trainedStat.progress,
			maxValue: this.trainedStat.getLevelThreshold(),
			smooth: true,
			showLabel: false,
		});

		this.els = {
			container: this.element,
			statName,
			levelText,
			progressBarContainer,
			progressBar,
			currentAllocation,
			toAllocate,
			controlsContainer,
		};
	}

	private setupControls() {
		const { controlsContainer } = this.els;

		// Create single train/untrain button
		const isTraining = this.trainedStat.assignedPoints > 0;
		new UIButton(controlsContainer, {
			text: isTraining ? "Stop Training" : "Train",
			onClick: () => this.toggleTraining(),
		});
	}

	private updateElement() {
		const { statName, levelText, progressBar, currentAllocation, toAllocate } = this.els;

		// Update stat info
		statName.textContent = this.trainedStat.name;
		levelText.textContent = `Level ${this.trainedStat.level}  •  ${formatNumberShort(
			this.trainedStat.progress
		)} / ${this.trainedStat.getLevelThreshold()} XP`;

		// Update progress bar
		const levelThreshold = this.trainedStat.getLevelThreshold();
		progressBar.setValue(this.trainedStat.progress);
		progressBar.setMax(levelThreshold);

		// Update allocation info and time to level
		const assignedPoints = this.trainedStat.assignedPoints;
		if (assignedPoints > 0) {
			const vigourMultiplier = this.context.player.vigourLevel;
			const timeToLevel = this.trainedStat.getTimeToNextLevel(vigourMultiplier);
			
			if (timeToLevel !== null) {
				const timeString = this.formatTime(timeToLevel);
				currentAllocation.textContent = `Training • ${timeString} to next level`;
			} else {
				currentAllocation.textContent = "Training";
			}
		} else {
			currentAllocation.textContent = "Not Training";
		}
	}

	private toggleTraining() {
		const isCurrentlyTraining = this.trainedStat.assignedPoints > 0;
		
		if (isCurrentlyTraining) {
			// Stop training - deallocate stamina
			this.manager.allocateTrainedStat(this.trainedStat.id, -1);
		} else {
			// Start training - allocate exactly 1 stamina
			this.manager.allocateTrainedStat(this.trainedStat.id, 1);
		}
		
		// Recreate controls to update button text
		this.els.controlsContainer.innerHTML = '';
		this.setupControls();
	}

	private formatTime(seconds: number): string {
		if (seconds < 60) {
			return `${Math.ceil(seconds)}s`;
		} else if (seconds < 3600) {
			const minutes = Math.floor(seconds / 60);
			const remainingSeconds = Math.ceil(seconds % 60);
			return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
		} else {
			const hours = Math.floor(seconds / 3600);
			const minutes = Math.floor((seconds % 3600) / 60);
			return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
		}
	}
}
