import { AreaSpec } from "@/models/Area";
import { BaseScreen } from "./BaseScreen";
import Markup from "./outposts.html?raw";
import { AreaStats } from "@/shared/stats-types";
import { bindEvent } from "@/shared/utils/busUtils";
import { PageHeaderDisplay } from "../components/ScreenComponents";

export class OutpostsScreen extends BaseScreen {
	readonly screenName = "outposts";
	private outpostsPanel!: HTMLElement;

	init() {
		this.addMarkuptoPage(Markup);
		const header = new PageHeaderDisplay(this.byId("outposts-screen"), "Outposts", "test2");
		this.outpostsPanel = this.byId("outposts-panel");

		this.setupTickingFeature("feature.outposts", () => {
			this.bindToEvents();
		});
	}

	protected handleTick(dt: number) {
		if (!this.isFeatureActive()) return;
	}

	protected onShow() {
		if (!this.isFeatureActive()) return;
		this.populate();
	}
	protected onHide() {}

	bindToEvents() {
		bindEvent(this.eventBindings, "stats:areaStatsChanged", () => {
			this.populate();
		});
	}

	populate() {
		this.outpostsPanel.innerHTML = "";
		const areaManager = this.context.currentRun?.huntManager.areaManager;
		const statsManager = this.context.services.statsManager;
		const unlockedAreas = areaManager?.getUnlockedAreas();
		unlockedAreas?.forEach((areaSpec: AreaSpec) => {
			const stats = statsManager.getAreaStats(areaSpec.id);
			this.outpostsPanel.appendChild(this.createRow(areaSpec, stats));
		});
	}

	// Create outpost row element
	createRow(area: AreaSpec, stats: AreaStats): HTMLElement {
		const kills = stats.bossKillsTotal || 0; // Use total boss kills from stats

		const container = document.createElement("div");
		container.classList.add("basic-section");
		const title = document.createElement("h2");
		title.textContent = area.displayName;

		const rowEl = document.createElement("ul");
		rowEl.classList.add("basic-list-boxes");

		const statusEl = document.createElement("li");
		statusEl.classList.add("outpost-status");
		if (kills < 10) {
			statusEl.classList.add("locked");
			statusEl.textContent = "Locked";
		} else if (kills >= 10 && kills < 20) {
			const levelEl = document.createElement("li");
			levelEl.textContent = `Level ${stats.outpostLevel.toString()}`;
			rowEl.appendChild(levelEl);

			statusEl.classList.add("active");
			statusEl.textContent = "Active";
		} else {
			const levelEl = document.createElement("li");
			levelEl.textContent = `Level ${stats.outpostLevel.toString()}`;
			rowEl.appendChild(levelEl);

			statusEl.classList.add("skippable");
			statusEl.textContent = "Skippable";
		}

		const bosskillsEl = document.createElement("li");
		bosskillsEl.classList.add("outpost-kills");
		bosskillsEl.textContent = `${kills}/10`; // Placeholder for boss kills

		rowEl.appendChild(statusEl);
		rowEl.appendChild(bosskillsEl);
		container.appendChild(title);
		container.appendChild(rowEl);

		return container;
	}
}
