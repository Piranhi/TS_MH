import { BaseScreen } from "./BaseScreen";
import Markup from "./library.html?raw";
import { ProgressBar } from "../components/ProgressBar";
import { bindEvent } from "@/shared/utils/busUtils";
import { ResearchUpgrade } from "@/features/settlement/ResearchUpgrade";
import { UpgradeSelectionContainer, UpgradeSelectionData } from "../components/UpgradeSelectionContainer";
import { BuildingStatus } from "../components/BuildingStatus";

export class LibraryScreen extends BaseScreen {
	readonly screenName = "library";
	private activeList!: HTMLElement;
	private upgradeGrid!: HTMLElement;
	private completedList!: HTMLElement;
	private upgradeContainer!: UpgradeSelectionContainer;

        init() {
                const root = this.addMarkuptoPage(Markup);
                const statusEl = root.querySelector("#library-building-status") as HTMLElement;
                const building = this.context.settlement.getBuilding("library");
                if (building && statusEl) new BuildingStatus(statusEl, building);
                this.activeList = this.byId("libraryActiveList");
		this.upgradeGrid = this.byId("libraryUpgradeGrid");
		this.completedList = this.byId("libraryCompletedList");
		this.build();
		bindEvent(this.eventBindings, "library:changed", () => this.build());
		bindEvent(this.eventBindings, "Game:UITick", () => this.updateActive());
	}
	show() {}
	hide() {}

	private build() {
		this.updateActive();
		if (!this.upgradeContainer) {
			this.upgradeContainer = new UpgradeSelectionContainer({
				container: this.upgradeGrid,
				upgrades: this.getAvailableUpgrades(),
				onUpgradeClick: (id) => this.context.library.startResearch(id),
			});
		} else {
			this.upgradeContainer.setUpgrades(this.getAvailableUpgrades());
		}
		this.updateCompleted();
	}

	private updateActive() {
		const active = this.context.library.getActive();
		this.activeList.innerHTML = "";
		active.forEach((upg) => {
			const row = document.createElement("div");
			row.className = "library-research-row";
			const icon = document.createElement("div");
			icon.className = "library-research-icon";
			icon.textContent = "📖";
			row.appendChild(icon);
			const info = document.createElement("div");
			info.className = "library-research-info";
			const title = document.createElement("span");
			title.className = "library-research-title";
			title.textContent = upg.name;
			info.appendChild(title);
			const progressContainer = document.createElement("div");
			progressContainer.className = "library-research-progress";
			info.appendChild(progressContainer);
			new ProgressBar({
				container: progressContainer,
				maxValue: upg.requiredTime,
				initialValue: upg.progress,
			});
			row.appendChild(info);
			this.activeList.appendChild(row);
		});
	}

	private getAvailableUpgrades(): UpgradeSelectionData[] {
		return this.context.library.getAvailable().map((upg) => ({
			id: upg.id,
			title: upg.name,
			description: upg.description,
			costs: [],
			requiredTime: upg.requiredTime,
			purchased: false,
			canAfford: true,
			buttonOverride: "Research",
		}));
	}

	private updateCompleted() {
		const list = this.context.library.getCompleted();
		this.completedList.innerHTML = "";
		list.forEach((id) => {
			const spec = ResearchUpgrade.getSpec(id);
			const li = document.createElement("li");
			li.textContent = spec ? spec.name : id;
			this.completedList.appendChild(li);
		});
	}
}
