import { BaseScreen } from "./BaseScreen";
import Markup from "./library.html?raw";
import { ProgressBar } from "../components/ProgressBar";
import { bindEvent } from "@/shared/utils/busUtils";
import { ResearchUpgrade } from "@/features/settlement/ResearchUpgrade";
import { UpgradeSelectionContainer } from "../components/UpgradeSelectionContainer";
import { BuildingStatus } from "../components/BuildingStatus";
import { UpgradeSelectionData } from "../components/UpgradeSelectionComponent";
import { formatNumberShort } from "@/shared/utils/stringUtils";

export class LibraryScreen extends BaseScreen {
	readonly screenName = "library";

	private activeList!: HTMLElement;
	private upgradeGrid!: HTMLElement;
	private completedList!: HTMLElement;
	private upgradeContainer!: UpgradeSelectionContainer;
	private speedEl!: HTMLElement;

	// Track active research progress bars
	private activeProgressBars: Map<string, ProgressBar> = new Map();

	init() {
		const root = this.addMarkuptoPage(Markup);

		// Initialize building status
		const statusEl = root.querySelector("#library-building-status") as HTMLElement;
		const building = this.context.settlement.getBuilding("library");
		if (building && statusEl) {
			new BuildingStatus(statusEl, building);
		}

		// Get DOM elements
		this.activeList = this.byId("libraryActiveList");
		this.upgradeGrid = this.byId("libraryUpgradeGrid");
		this.completedList = this.byId("libraryCompletedList");
		this.speedEl = this.byId("library-section-speed");

		this.setupUpgrades();
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
		// Listen for library changes
		bindEvent(this.eventBindings, "library:changed", () => this.build());
		bindEvent(this.eventBindings, "Game:UITick", () => this.updateActiveResearch());
		bindEvent(this.eventBindings, "modifier:changed", () => this.updateSpeed());
		bindEvent(this.eventBindings, "settlement:changed", () => this.updateUpgrades());
	}

	private setupUpgrades() {
		// Initialize upgrade container
		this.upgradeContainer = new UpgradeSelectionContainer({
			container: this.upgradeGrid,
			upgrades: this.getAvailableUpgrades(),
			onUpgradeClick: (id) => this.handleResearchClick(id),
		});
	}

	private handleResearchClick(researchId: string) {
		// Start research
		const success = this.context.library.startResearch(researchId);

		//if (success) {
		// Update the display
		this.updateActiveResearch();
		this.updateUpgrades();
		//}
	}

	private updateSpeed() {
		const speed = this.context.library.getResearchSpeed();
		this.speedEl.textContent = `Research Speed: ${speed.toFixed(1)}x`;
	}

	private build() {
		this.updateActiveResearch();
		this.updateUpgrades();
		this.updateCompleted();
		this.updateSpeed();
	}

	private updateActiveResearch() {
		const activeResearch = this.context.library.getActive();

		// Clear existing content
		this.activeList.innerHTML = "";

		// Clear old progress bars
		this.activeProgressBars.forEach((bar) => bar.destroy());
		this.activeProgressBars.clear();

		if (activeResearch.length === 0) {
			// Show empty state
			const emptyMsg = document.createElement("div");
			emptyMsg.className = "library_empty-state";
			emptyMsg.textContent = "No active research";
			this.activeList.appendChild(emptyMsg);
			return;
		}

		// Create research rows
		activeResearch.forEach((research) => {
			const row = this.createActiveResearchRow(research);
			this.activeList.appendChild(row);
		});
	}

	private createActiveResearchRow(research: any): HTMLElement {
		const row = document.createElement("div");
		row.className = "library_research-row";

		// Research icon
		const icon = document.createElement("div");
		icon.className = "library_research-icon";
		icon.textContent = research.icon || "📖";
		row.appendChild(icon);

		// Research info
		const info = document.createElement("div");
		info.className = "library_research-info";

		const title = document.createElement("div");
		title.className = "library_research-title";
		title.textContent = research.name;
		info.appendChild(title);

		const description = document.createElement("div");
		description.className = "library_research-description";
		description.textContent = research.description;
		info.appendChild(description);

		// Progress container
		const progressContainer = document.createElement("div");
		progressContainer.className = "library_research-progress";

		// Create progress bar
		const progressBar = new ProgressBar({
			container: progressContainer,
			maxValue: research.requiredTime,
			initialValue: research.progress,
		});

		// Track progress bar for updates
		this.activeProgressBars.set(research.id, progressBar);

		// Time remaining
		const remaining = Math.max(0, research.requiredTime - research.progress);
		const timeRemaining = document.createElement("div");
		timeRemaining.className = "library_time-remaining";
		timeRemaining.textContent = `${Math.ceil(remaining)}s remaining`;
		progressContainer.appendChild(timeRemaining);

		info.appendChild(progressContainer);
		row.appendChild(info);

		return row;
	}

	private updateUpgrades() {
		// Update the upgrade container with latest data
		const upgrades = this.getAvailableUpgrades();
		this.upgradeContainer.setUpgrades(upgrades);
	}

	private getAvailableUpgrades(): UpgradeSelectionData[] {
		const availableResearch = this.context.library.getAvailable();

		return availableResearch.map((research) => {
			// Check if player can afford this research
			const canAfford = true; // Research typically doesn't have resource costs

			return {
				id: research.id,
				title: research.name,
				description: research.description,
				costs: [], // Research typically doesn't have resource costs
				requiredTime: research.requiredTime,
				level: research.level,
				maxLevel: research.maxLevel,
				purchased: research.unlocked,
				canAfford,
				buttonOverride: research.unlocked ? "Completed" : "Research",
			};
		});
	}

	private updateCompleted() {
		const completedResearch = this.context.library.getCompleted();

		// Clear existing content
		this.completedList.innerHTML = "";

		if (completedResearch.length === 0) {
			// Show empty state
			const emptyMsg = document.createElement("li");
			emptyMsg.className = "library_completed-empty";
			emptyMsg.textContent = "No completed research yet";
			this.completedList.appendChild(emptyMsg);
			return;
		}

		// Add completed research items
		completedResearch.forEach((researchId) => {
			const spec = ResearchUpgrade.getSpec(researchId);
			if (!spec) return;

			const listItem = document.createElement("li");
			listItem.className = "library_completed-item";
			listItem.textContent = spec.name;
			this.completedList.appendChild(listItem);
		});
	}

	// Update method called by game loop
	handleTick(deltaMs: number) {
		// Update active research progress bars
		const activeResearch = this.context.library.getActive();

		activeResearch.forEach((research) => {
			const progressBar = this.activeProgressBars.get(research.id);
			if (progressBar) {
				progressBar.setValue(research.progress);
			}
		});
	}
}
