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
	efficiencyElements: {
		percentageEl: HTMLElement;
		goldAllocationEl: HTMLElement;
		progressText: HTMLElement;
		minusBtn: HTMLButtonElement;
		plusBtn: HTMLButtonElement;
		maxBtn: HTMLButtonElement;
		goldInput: HTMLInputElement;
		notEnoughGoldEl: HTMLElement;
	};
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
	private settlementLevelEl!: HTMLElement;

	// Settlement level thresholds (exponential scaling)
	private readonly SETTLEMENT_LEVEL_THRESHOLDS = [
		0, // Level 1 (starting)
		100, // Level 2
		300, // Level 3
		750, // Level 4
		1500, // Level 5
		3000, // Level 6
		6000, // Level 7
		12000, // Level 8
		24000, // Level 9
		48000, // Level 10
	];

	init() {
		const root = this.addMarkuptoPage(Markup);

		// Get DOM elements
		this.buildingGrid = this.byId("settlement-building-grid");
		this.buildingTemplate = this.byId("settlement-building-template") as HTMLTemplateElement;
		this.buildPointsEl = this.byId("settlement-build-points");
		this.progressFill = this.byId("settlement-progress-fill");
		this.rewardInfo = this.byId("settlement-reward-info");
		this.timeInfo = this.byId("settlement-time-info");
		this.settlementLevelEl = root.querySelector(".settlement_level") as HTMLElement;

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
		bindEvent(this.eventBindings, "Game:UITick", () => this.updateDynamicElements());
		bindEvent(this.eventBindings, "Game:GameTick", () => this.updateHeader());
		bindEvent(this.eventBindings, "resources:changed", () => this.updateBuildingButtons());
		bindEvent(this.eventBindings, "player:goldChanged", () => this.updateEfficiencyDisplays());
	}

	private build() {
		this.updateHeader();
		this.updateBuildings();
		this.updateDynamicElements();
	}

	private updateHeader() {
		// Update build points
		const buildPoints = this.context.settlement.totalBuildPoints;
		this.buildPointsEl.textContent = formatNumberShort(buildPoints);

		// Update settlement level and renown requirement
		this.updateSettlementLevel();

		// Update settlement progress (passive rewards)
		const progressData = this.context.settlement.getPassiveSnapshot();
		if (progressData) {
			const progressPercent = (progressData.progress / progressData.max) * 100;
			this.progressFill.style.width = `${progressPercent}%`;
		}
	}

	private updateSettlementLevel() {
		const currentRenown = this.context.settlement.totalSettlementRenown;
		const currentLevel = this.getSettlementLevel(currentRenown);
		const nextLevelRenown = this.SETTLEMENT_LEVEL_THRESHOLDS[currentLevel] || "MAX";

		if (nextLevelRenown === "MAX") {
			this.settlementLevelEl.textContent = `Level ${currentLevel} Settlement (MAX)`;
		} else {
			const needed = nextLevelRenown - currentRenown;
			this.settlementLevelEl.textContent = `Level ${currentLevel} Settlement (${formatNumberShort(needed)} renown to Level ${
				currentLevel + 1
			})`;
		}
	}

	private getSettlementLevel(renown: number): number {
		for (let i = this.SETTLEMENT_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
			if (renown >= this.SETTLEMENT_LEVEL_THRESHOLDS[i]) {
				return i + 1;
			}
		}
		return 1;
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
			if (!building.checkUnlockRequirements()) return;
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
		icon.src = building.iconUrl;
		name.textContent = building.displayName;
		level.textContent = `Level ${building.level}`;
		description.textContent = building.description || "";

		// Create efficiency progress bar (shows time until next gold consumption)
		const progressBar = new ProgressBar({
			container: progressContainer,
			maxValue: 10, // 10 second cycle
			initialValue: 0,
			showLabel: false,
		});

		// Create efficiency section
		const efficiencySection = this.createEfficiencySection(element, building);

		// Setup upgrade button
		this.setupUpgradeButton(upgradeButton, building);

		return {
			element,
			progressBar,
			buildingId: building.id,
			upgradeButton,
			efficiencyElements: efficiencySection,
		};
	}

	private createEfficiencySection(cardElement: HTMLElement, building: Building) {
		// Create efficiency section HTML
		const efficiencyHTML = `
			<div class="settlement_efficiency-section">
				<div class="settlement_efficiency-header">
					<div class="settlement_efficiency-percentage">+<span class="efficiency-value">0</span>% Efficiency</div>
					<div class="settlement_gold-allocation">Gold: <span class="gold-amount">0</span>/cycle</div>
				</div>
				<div class="settlement_efficiency-progress-text">Next gold consumption in: 10s</div>
				<div class="settlement_efficiency-controls">
					<button class="settlement_gold-btn settlement_gold-minus">-</button>
					<input type="number" class="settlement_gold-input" value="0" min="0" step="10">
					<button class="settlement_gold-btn settlement_gold-plus">+</button>
					<button class="settlement_gold-btn settlement_gold-max">Max</button>
				</div>
				<div class="settlement_not-enough-gold hidden">⚠️ Not enough gold for next cycle</div>
			</div>
		`;

		// Insert the efficiency section before the actions
		const actionsElement = cardElement.querySelector(".settlement_building-actions");
		if (actionsElement) {
			actionsElement.insertAdjacentHTML("beforebegin", efficiencyHTML);
		}

		// Get efficiency elements
		const efficiencyElements = {
			percentageEl: cardElement.querySelector(".efficiency-value") as HTMLElement,
			goldAllocationEl: cardElement.querySelector(".gold-amount") as HTMLElement,
			progressText: cardElement.querySelector(".settlement_efficiency-progress-text") as HTMLElement,
			minusBtn: cardElement.querySelector(".settlement_gold-minus") as HTMLButtonElement,
			plusBtn: cardElement.querySelector(".settlement_gold-plus") as HTMLButtonElement,
			maxBtn: cardElement.querySelector(".settlement_gold-max") as HTMLButtonElement,
			goldInput: cardElement.querySelector(".settlement_gold-input") as HTMLInputElement,
			notEnoughGoldEl: cardElement.querySelector(".settlement_not-enough-gold") as HTMLElement,
		};

		// Setup efficiency controls
		this.setupEfficiencyControls(efficiencyElements, building);

		return efficiencyElements;
	}

	private setupEfficiencyControls(elements: any, building: Building) {
		// Get the building state - note that state may be private, so we'll access it through methods
		const getCurrentAllocation = () => (building as any).state?.goldAllocation || 0;

		// Set initial values
		elements.goldInput.value = getCurrentAllocation().toString();

		// Minus button
		elements.minusBtn.addEventListener("click", () => {
			const current = parseInt(elements.goldInput.value) || 0;
			const newValue = Math.max(0, current - 10);
			elements.goldInput.value = newValue.toString();
			building.allocateGold(newValue);
			this.updateEfficiencyDisplay(elements, building);
		});

		// Plus button
		elements.plusBtn.addEventListener("click", () => {
			const current = parseInt(elements.goldInput.value) || 0;
			const newValue = current + 10;
			elements.goldInput.value = newValue.toString();
			building.allocateGold(newValue);
			this.updateEfficiencyDisplay(elements, building);
		});

		// Max button (set to affordable amount)
		elements.maxBtn.addEventListener("click", () => {
			const playerGold = this.context.player.currentGold;
			const efficiency = (building as any).state?.goldEfficiencyLevel || 0;
			const costMultiplier = Math.pow(1.5, efficiency);
			const maxAffordable = Math.floor(playerGold / costMultiplier / 10) * 10; // Round down to nearest 10
			elements.goldInput.value = maxAffordable.toString();
			building.allocateGold(maxAffordable);
			this.updateEfficiencyDisplay(elements, building);
		});

		// Input change
		elements.goldInput.addEventListener("change", () => {
			const value = Math.max(0, parseInt(elements.goldInput.value) || 0);
			elements.goldInput.value = value.toString();
			building.allocateGold(value);
			this.updateEfficiencyDisplay(elements, building);
		});

		// Initial update
		this.updateEfficiencyDisplay(elements, building);
	}

	private updateEfficiencyDisplay(elements: any, building: Building) {
		const efficiency = building.getEfficiencyMultiplier();
		const percentage = Math.round((efficiency - 1) * 100);
		const allocation = (building as any).state?.goldAllocation || 0;
		const efficiencyLevel = (building as any).state?.goldEfficiencyLevel || 0;
		const costMultiplier = Math.pow(1.5, efficiencyLevel);
		const nextCost = Math.ceil(allocation * costMultiplier);
		const playerGold = this.context.player.currentGold;

		// Update efficiency percentage
		elements.percentageEl.textContent = percentage.toString();

		// Update gold allocation
		elements.goldAllocationEl.textContent = allocation.toString();

		// Update input value
		elements.goldInput.value = allocation.toString();

		// Show/hide not enough gold warning
		if (allocation > 0 && playerGold < nextCost) {
			elements.notEnoughGoldEl.classList.remove("hidden");
			elements.notEnoughGoldEl.textContent = `⚠️ Not enough gold for next cycle (need ${formatNumberShort(nextCost)})`;
		} else {
			elements.notEnoughGoldEl.classList.add("hidden");
		}

		// Update button states
		elements.minusBtn.disabled = allocation <= 0;

		// Update efficiency status color
		const efficiencyClass = percentage === 0 ? "normal" : percentage < 50 ? "medium" : "high";
		elements.percentageEl.className = `efficiency-value ${efficiencyClass}`;
	}

	private setupUpgradeButton(button: HTMLButtonElement, building: Building): HTMLButtonElement {
		const costData = building.getUnlockCostData();
		const canAfford = this.context.settlement.totalBuildPoints >= costData.cost;

		// Set button text and state
		if (building.level >= 6) {
			// Max level from GameBalance
			button.textContent = "Max Level";
			button.disabled = true;
		} else {
			button.textContent = `Upgrade (${formatNumberShort(costData.cost)} BP)`;
			button.disabled = !canAfford;
		}

		// Create a new button to replace the old one (removes old event listeners)
		const newButton = button.cloneNode(true) as HTMLButtonElement;

		// Add click handler
		const handleClick = () => {
			if (canAfford && building.level < 6) {
				// Spend the build points to upgrade
				this.context.settlement.spendBuildPoints(building.id as BuildingType, costData.cost);
			}
		};

		newButton.addEventListener("click", handleClick);

		// Replace the old button
		button.parentElement?.replaceChild(newButton, button);

		return newButton;
	}

	private updateBuildingButtons() {
		// Update button states based on current build points
		this.buildingDisplays.forEach((display) => {
			const building = this.context.settlement.getBuilding(display.buildingId as BuildingType);
			if (building) {
				display.upgradeButton = this.setupUpgradeButton(display.upgradeButton, building);
			}
		});
	}

	private updateEfficiencyDisplays() {
		// Update all efficiency displays when gold changes
		this.buildingDisplays.forEach((display) => {
			const building = this.context.settlement.getBuilding(display.buildingId as BuildingType);
			if (building) {
				this.updateEfficiencyDisplay(display.efficiencyElements, building);
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

		// Update building efficiency progress bars (10-second cycles)
		// Since we can't access the private goldTimer, we'll simulate the progress
		const now = Date.now();
		this.buildingDisplays.forEach((display) => {
			const building = this.context.settlement.getBuilding(display.buildingId as BuildingType);
			if (building) {
				const allocation = (building as any).state?.goldAllocation || 0;
				if (allocation > 0) {
					// Simulate 10-second cycle progress
					const cycleProgress = (now % 10000) / 1000; // 0-10 seconds
					display.progressBar.setValue(cycleProgress);

					// Update progress text
					const remaining = 10 - cycleProgress;
					display.efficiencyElements.progressText.textContent = `Next gold consumption in: ${remaining.toFixed(1)}s`;
				} else {
					// No gold allocated, no progress
					display.progressBar.setValue(0);
					display.efficiencyElements.progressText.textContent = "No gold allocated";
				}
			}
		});

		// Update settlement level info
		this.updateSettlementLevel();
	}

	// Update method called by game loop
	handleTick(deltaMs: number) {
		// Update dynamic elements that change frequently
		this.updateDynamicElements();
	}
}
