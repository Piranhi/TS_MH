import { BaseScreen } from "./BaseScreen";
import Markup from "./settlement.html?raw";
import { bindEvent } from "@/shared/utils/busUtils";
import { formatTimeFull, formatNumberShort } from "@/shared/utils/stringUtils";
import { ProgressBar } from "../components/ProgressBar";
import { BuildingType } from "@/shared/types";
import { Building } from "@/features/settlement/Building";

interface BuildingDisplay {
	element: HTMLElement;
	progressBar: ProgressBar;
	buildingId: string;
	upgradeButton: HTMLButtonElement;
}

export class SettlementScreen extends BaseScreen {
	readonly screenName = "settlement";

	private buildingGrid!: HTMLElement;
	private buildingTemplate!: HTMLTemplateElement;
	private buildingDisplays: BuildingDisplay[] = [];

	// Header elements
	private buildPointsEl!: HTMLElement;
	private progressFill!: HTMLElement;
	private rewardInfo!: HTMLElement;
	private timeInfo!: HTMLElement;

	init() {
		const root = this.addMarkuptoPage(Markup);

		// Get DOM elements
		this.buildingGrid = this.byId("settlement-building-grid");
		this.buildingTemplate = this.byId("settlement-building-template") as HTMLTemplateElement;
		this.buildPointsEl = this.byId("settlement-build-points");
		this.progressFill = this.byId("settlement-progress-fill");
		this.rewardInfo = this.byId("settlement-reward-info");
		this.timeInfo = this.byId("settlement-time-info");

		this.setupEvents();
		this.build();
	}

	show() {
		// Update everything when screen becomes visible
		this.build();
	}

	hide() {
		// Clean up any resources if needed
	}

	private setupEvents() {
		// Listen for settlement changes
		bindEvent(this.eventBindings, "settlement:changed", () => this.build());
		//bindEvent(this.eventBindings, "Game:UITick", () => this.updateDynamicElements());
		bindEvent(this.eventBindings, "resources:changed", () => this.updateBuildingButtons());
	}

	private build() {
		this.updateHeader();
		this.updateBuildings();
		//this.updateDynamicElements();
	}

	private updateHeader() {
		// Update build points
		const buildPoints = this.context.settlement.totalBuildPoints;
		this.buildPointsEl.textContent = formatNumberShort(buildPoints);

		// Update settlement progress (if applicable)
		const progressData = this.context.settlement.getPassiveSnapshot();
		if (progressData) {
			const progressPercent = (progressData.progress / progressData.max) * 100;
			this.progressFill.style.width = `${progressPercent}%`;
		}
	}

	private updateBuildings() {
		// Clear existing buildings
		this.buildingDisplays.forEach((display) => {
			display.progressBar.destroy();
			display.element.remove();
		});
		this.buildingDisplays = [];

		// Get all buildings
		const buildings = this.context.settlement.getAllBuildings();

		// Create building cards
		buildings.forEach((building) => {
			const buildingCard = this.createBuildingCard(building);
			this.buildingGrid.appendChild(buildingCard.element);
			this.buildingDisplays.push(buildingCard);
		});
	}

	private createBuildingCard(building: Building): BuildingDisplay {
		// Clone template
		const clone = this.buildingTemplate.content.cloneNode(true) as DocumentFragment;
		const element = clone.querySelector(".settlement_building-card") as HTMLElement;

		// Get elements from template
		const icon = element.querySelector(".settlement_building-icon") as HTMLImageElement;
		const name = element.querySelector(".settlement_building-name") as HTMLElement;
		const level = element.querySelector(".settlement_building-level") as HTMLElement;
		const description = element.querySelector(".settlement_building-description") as HTMLElement;
		const progressContainer = element.querySelector(".settlement_building-progress-bar") as HTMLElement;
		const progressText = element.querySelector(".settlement_building-progress-text") as HTMLElement;
		const upgradeButton = element.querySelector(".settlement_building-upgrade-btn") as HTMLButtonElement;

		// Set building data
		icon.src = building.iconUrl || "";
		name.textContent = building.displayName;
		level.textContent = `Level ${building.level}`;
		description.textContent = building.description || "";

		// Create progress bar
		const progressBar = new ProgressBar({
			container: progressContainer,
			maxValue: building.getUnlockCostData().cost || 100,
			initialValue: building.getUnlockCostData().spent || 0,
			showLabel: true,
		});

		// Update progress text
		this.updateProgressText(progressText, building);

		// Setup upgrade button
		this.setupUpgradeButton(upgradeButton, building);

		return {
			element,
			progressBar,
			buildingId: building.id,
			upgradeButton,
		};
	}

	private updateProgressText(textElement: HTMLElement, building: any) {
		if (building.isUpgrading) {
			const remaining = Math.max(0, building.upgradeRequirement - building.currentProgress);
			textElement.textContent = `Upgrading... ${formatTimeFull(remaining)} remaining`;
		} else if (building.canUpgrade) {
			textElement.textContent = `Ready to upgrade to Level ${building.level + 1}`;
		} else {
			textElement.textContent = `Max level reached`;
		}
	}

	private setupUpgradeButton(button: HTMLButtonElement, building: Building) {
		// Set button text based on building state
		if (building.level < 6) {
			button.textContent = `Upgrade (${formatNumberShort(building.getUnlockCostData().cost)} BP)`;
			//button.disabled = !this.context.settlement.canAffordUpgrade(building.id);
		} else {
			button.textContent = "Max Level";
			button.disabled = true;
		}

		// Add click handler
		button.addEventListener("click", () => {
			building.spendPoints(building.getUnlockCostData().cost);
			//this.context.settlement.upgradeBuilding(building.id);
		});
	}

	private updateBuildingButtons() {
		// Update button states based on current resources
		this.buildingDisplays.forEach((display) => {
			const building = this.context.settlement.getBuilding(display.buildingId as BuildingType);
			if (building) {
				this.setupUpgradeButton(display.upgradeButton, building);
			}
		});
	}

	private updateDynamicElements() {
		const snapshot = this.context.settlement.getPassiveSnapshot();
		// Update settlement reward info
		const rewardMultiplier = snapshot.reward;
		this.rewardInfo.textContent = `Reward: ${rewardMultiplier.toFixed(1)}x`;

		// Update time to next reward peak
		const timeToNext = snapshot.timeToNext;
		this.timeInfo.textContent = `Next reward in: ${formatTimeFull(timeToNext)}`;

		// Update building progress bars
		this.buildingDisplays.forEach((display) => {
			const building = this.context.settlement.getBuilding(display.buildingId as BuildingType);
			/* 			if (building && building.isUpgrading) {
				display.progressBar.setValue(building.currentProgress);

				// Update progress text
				const progressText = display.element.querySelector(".settlement_building-progress-text") as HTMLElement;
				this.updateProgressText(progressText, building);
			} */
		});
	}

	// Update method called by game loop
	update(deltaMs: number) {
		// Update dynamic elements that change frequently
		this.updateDynamicElements();
	}
}
