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

		// Create buttons matching the design
		new UIButton(controlsContainer, {
			text: "-1",
			onClick: () => this.adjustAmount(-1),
		});

		new UIButton(controlsContainer, {
			text: "0",
			onClick: () => this.confirmAllocation(),
		});

		new UIButton(controlsContainer, {
			text: "+1",
			onClick: () => this.adjustAmount(1),
		});

		new UIButton(controlsContainer, {
			text: "Half",
			onClick: () => this.setToHalf(),
		});

		new UIButton(controlsContainer, {
			text: "Max",
			onClick: () => this.setToMax(),
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

		// Update allocation info
		const maxPoints = this.context.currentRun?.trainedStats.maxStamina; // this.trainedStat.maxAssignedPoints;
		const assignedPoints = this.trainedStat.assignedPoints;
		currentAllocation.textContent = `Assigned: ${assignedPoints}/${maxPoints}`;
	}

	private adjustAmount(delta: number) {
		this.manager.allocateTrainedStat(this.trainedStat.id, delta);
	}

	private setToZero() {
		const currentlyAllocated = this.trainedStat.assignedPoints;
		if (currentlyAllocated > 0) {
			this.adjustAmount(-currentlyAllocated);
		}
	}

	private setToMax() {
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
		const targetPoints = Math.floor(this.trainedStat.maxAssignedPoints / 2);
		const currentlyAllocated = this.trainedStat.assignedPoints;
		const neededPoints = targetPoints - currentlyAllocated;

		if (neededPoints > 0) {
			const availableEnergy = this.context.player.energyPool.current;
			const pointsToAllocate = Math.min(neededPoints, availableEnergy);
			if (pointsToAllocate > 0) {
				this.adjustAmount(pointsToAllocate);
			}
		} else if (neededPoints < 0) {
			this.adjustAmount(neededPoints);
		}
	}

	private confirmAllocation() {
		// This would handle confirming the allocation
		// You might want to emit an event or call a method on the manager
		console.log("Confirming allocation for", this.trainedStat.name);
	}
}
