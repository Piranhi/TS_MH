import { TrainedStat } from "@/models/TrainedStat";
import { TrainedStatManager } from "@/models/TrainedStatManager";
import { UIBase } from "./UIBase";
import { bindEvent } from "@/shared/utils/busUtils";
import { ProgressBar } from "./ProgressBar";
import { UIButton } from "./UIButton";

interface StatCardElements {
	container: HTMLElement;
	statName: HTMLElement;
	levelText: HTMLElement;
	progressBarContainer: HTMLElement;
	progressBar: ProgressBar;
	progressText: HTMLElement;
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
		// Main stat card container
		const statCard = document.createElement("div");
		statCard.className = "stat-card";

		// Header section with stat info and progress
		const headerSection = document.createElement("div");
		headerSection.className = "flex flex-wrap items-center justify-between gap-4";

		// Left side - stat name and level
		const statInfo = document.createElement("div");

		const statName = document.createElement("h3");
		statName.className = "basic-title";
		statName.textContent = this.trainedStat.name;

		const levelText = document.createElement("p");
		levelText.className = "basic-text-light";
		levelText.textContent = `Current Level: ${this.trainedStat.level}`;

		statInfo.appendChild(statName);
		statInfo.appendChild(levelText);

		// Right side - progress bar section
		const progressSection = document.createElement("div");
		progressSection.className = "flex items-center gap-4";

		// Progress bar container
		const progressBarContainer = document.createElement("div");
		progressBarContainer.className = "progress-bar-container";

		// Progress text
		const progressText = document.createElement("p");
		progressText.className = "text-sm font-semibold";

		progressSection.appendChild(progressBarContainer);
		progressSection.appendChild(progressText);

		headerSection.appendChild(statInfo);
		headerSection.appendChild(progressSection);

		// Bottom section - Energy allocation
		const bottomSection = document.createElement("div");
		bottomSection.className = "energy-allocation-container";

		const energyTitle = document.createElement("h4");
		energyTitle.className = "basic-subtitle";
		energyTitle.textContent = "Energy Allocation";

		// Allocation status bar
		const allocationBar = document.createElement("div");
		allocationBar.className = "energy-allocation-box";

		const currentAllocation = document.createElement("span");
		currentAllocation.className = "font-medium";

		const toAllocate = document.createElement("span");
		toAllocate.className = "font-bold text-[var(--primary-color)]";

		allocationBar.appendChild(currentAllocation);
		allocationBar.appendChild(toAllocate);

		// Controls container
		const controlsContainer = document.createElement("div");
		controlsContainer.className = "grid grid-cols-2 gap-3 sm:grid-cols-5";

		bottomSection.appendChild(energyTitle);
		bottomSection.appendChild(allocationBar);
		bottomSection.appendChild(controlsContainer);

		// Assemble the card
		statCard.appendChild(headerSection);
		statCard.appendChild(bottomSection);

		// Create progress bar using existing ProgressBar class
		const progressBar = new ProgressBar({
			container: progressBarContainer,
			initialValue: this.trainedStat.progress,
			maxValue: this.trainedStat.getLevelThreshold(),
			smooth: true,
			showLabel: false, // We'll handle the label separately
		});

		// Store references
		this.els = {
			container: statCard,
			statName,
			levelText,
			progressBarContainer,
			progressBar,
			progressText,
			currentAllocation,
			toAllocate,
			controlsContainer,
		};

		this.element = statCard;
		this.attachTo(this.root);
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
		const { statName, levelText, progressBar, progressText, currentAllocation, toAllocate } = this.els;

		// Update stat info
		statName.textContent = this.trainedStat.name;
		levelText.textContent = `Current Level: ${this.trainedStat.level}`;

		// Update progress bar
		const levelThreshold = this.trainedStat.getLevelThreshold();
		progressBar.setValue(this.trainedStat.progress);
		progressBar.setMax(levelThreshold);

		// Update progress text (matches the design format)
		progressText.textContent = `${Math.floor(this.trainedStat.progress)} / ${levelThreshold}`;

		// Update allocation info
		const maxPoints = this.trainedStat.maxAssignedPoints;
		const assignedPoints = this.trainedStat.assignedPoints;
		currentAllocation.textContent = `Current: ${assignedPoints}/${maxPoints}`;

		// Calculate "To Allocate" - this would need to track pending changes
		// For now, showing 0 as in the example
		toAllocate.textContent = `To Allocate: 0`;
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
