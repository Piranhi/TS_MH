import { bindEvent } from "@/shared/utils/busUtils";
import { UIBase } from "./UIBase";
import { AreaStats } from "@/shared/stats-types";
import { ProgressBar } from "./ProgressBar";
import { GAME_BALANCE } from "@/balance/GameBalance";
import { Area } from "@/models/Area";
import { UIButton } from "./UIButton";

export class AreaDisplay extends UIBase {
	private static readonly CSS_CLASSES = {
		AREA_STATS: "area-stats",
		AREA_STATS_TITLE: "area-stats__title",
		AREA_STATS_ROW: "area-stats__row",
		FIGHT_BOSS_BTN: "fight-boss-btn",
	} as const;

	private static readonly DOM_IDS = {
		STATS_ROWS: "stats-rows",
		AREA_PROGRESS: "area-progress",
		FIGHT_BOSS_BTN: "fight-boss-btn",
		BUILD_OUTPOST_BTN: "build-outpost-btn",
		OPTIONS: "area-options",
	} as const;

	private killsNeededForBossEl!: ProgressBar;
	private clearsNeededForOutpostEl!: ProgressBar;
	private fightBossBtn!: UIButton;
	private buildOutpostBtn!: UIButton;
	private optionsContainer!: HTMLDivElement;
	private autoAdvanceCb!: HTMLInputElement;

	constructor(parentElement: HTMLElement) {
		super();
		this.element = parentElement;
		if (this.context.hunt.getActiveArea()) {
			this.createAreaStatsSection(this.context.hunt.getActiveArea()!);
			this.updateAreaStats(this.getAreaStats());
		}
		this.bindEvents();
	}

	private bindEvents() {
		bindEvent(this.eventBindings, "hunt:areaChanged", (area) => {
			this.createAreaStatsSection(area);
			this.updateAreaStats(this.getAreaStats());
		});
		bindEvent(this.eventBindings, "stats:areaStatsChanged", (stats) => this.updateAreaStats(stats));
	}

	/**
	 * Creates the complete area stats section with all elements
	 * @param stats - Initial configuration for the stats display
	 * @returns The created section element for potential further manipulation
	 */
	public createAreaStatsSection(area: Area): HTMLElement {
		this.element.innerHTML = "";
		// Create the main section container
		const section = this.createElement("section", {});
		if (!area) return section;

		// Create and add the title
		const title = this.createElement("h2", {
			className: "basic-title",
			textContent: area.displayName, // "Area Stats",
		}); // Create action buttons

		const statsDiv = this.createElement("div", {
			id: AreaDisplay.DOM_IDS.STATS_ROWS,
		});
		const progressDiv = this.createElement("div", {
			id: "AreaDisplay.DOM_IDS.AREA_PROGRESS",
			className: "area-progress",
		});

		// Container for extra options like auto progression
		this.optionsContainer = this.createElement("div", {
			id: AreaDisplay.DOM_IDS.OPTIONS,
			className: "area-options",
		});

		// Create auto advance checkbox
		this.createAutoAdvanceCheckbox();

		const killsNeeded = this.createElement("span", {
			textContent: "Kills Needed",
			className: "basic-subtitle",
		});
		const clearsNeeded = this.createElement("span", {
			textContent: "Clears Needed",
			className: "basic-subtitle",
		});
		progressDiv.appendChild(killsNeeded);
		this.killsNeededForBossEl = new ProgressBar({
			container: progressDiv,
			label: "0/100",
			showLabel: true,
			initialValue: 0,
			maxValue: GAME_BALANCE.hunt.enemiesNeededForBoss,
		});
		this.fightBossBtn = new UIButton(progressDiv, {
			text: "Fight Boss",
			disabled: true,
			id: AreaDisplay.DOM_IDS.FIGHT_BOSS_BTN,
			onClick: this.onFightBoss,
		});

		progressDiv.appendChild(clearsNeeded);
		this.clearsNeededForOutpostEl = new ProgressBar({
			container: progressDiv,
			label: "0/100",
			showLabel: true,
			initialValue: 0,
			maxValue: GAME_BALANCE.hunt.clearsNeededForOutpost,
		});
		this.buildOutpostBtn = new UIButton(progressDiv, {
			text: "Build Outpost",
			disabled: true,
			id: AreaDisplay.DOM_IDS.BUILD_OUTPOST_BTN,
			onClick: this.onFightBoss,
		});

		// Assemble the section
		section.appendChild(title);
		section.appendChild(progressDiv);
		section.appendChild(this.optionsContainer);
		section.appendChild(statsDiv);

		// Add to the container
		this.element.appendChild(section);

		return section;
	}

	/**
	 * Creates the auto advance checkbox and adds it to the options container
	 */
	private createAutoAdvanceCheckbox(): void {
		const label = document.createElement("label");
		label.textContent = "Auto advance";
		this.autoAdvanceCb = document.createElement("input");
		this.autoAdvanceCb.type = "checkbox";
		label.prepend(this.autoAdvanceCb);

		// Add event listener for checkbox change
		this.autoAdvanceCb.addEventListener("change", this.onAutoAdvanceChange);

		this.optionsContainer.appendChild(label);
	}

	/**
	 * Handles auto advance checkbox change
	 */
	private onAutoAdvanceChange = (e: Event) => {
		const enabled = (e.target as HTMLInputElement).checked;
		this.context.hunt.setAutoAdvance(enabled);
	};

	/**
	 * Allows other components to add option elements to the area display
	 */
	public addOptionElement(el: HTMLElement) {
		if (this.optionsContainer) {
			this.optionsContainer.appendChild(el);
		}
	}

	private onFightBoss = (e: Event) => {
		e.preventDefault();
		this.context.hunt.fightBoss();
	};

	private updateAreaStats(stats: AreaStats) {
		if (!stats) return;
		try {
			this.fightBossBtn.setState(stats.bossUnlockedThisRun ? "enabled" : "disabled");
			this.buildOutpostBtn.setState(stats.outpostAvailable ? "enabled" : "disabled");

			const container = this.$(`#${AreaDisplay.DOM_IDS.STATS_ROWS}`) as HTMLDivElement;
			container.innerHTML = "<h3 style='margin: 0 0 1rem 0;'>Area Progress</h3>";

			// Create stat rows using our helper method
			const statRows = this.createStatRows(stats);

			// Add all stat rows
			statRows.forEach((row) => container.appendChild(row));
			this.updateProgressbar(stats);
		} catch (e) {
			console.error("Error updating progressbar", e);
		}
	}

	private updateProgressbar(stats: AreaStats) {
		this.killsNeededForBossEl.setValue(stats.killsThisRun);
		this.killsNeededForBossEl.setLabel(
			`${Math.min(stats.killsThisRun, GAME_BALANCE.hunt.enemiesNeededForBoss)}/${GAME_BALANCE.hunt.enemiesNeededForBoss}`
		);
		this.clearsNeededForOutpostEl.setValue(stats.bossKillsTotal);
		this.clearsNeededForOutpostEl.setLabel(`${stats.bossKillsTotal}/${GAME_BALANCE.hunt.clearsNeededForOutpost}`);
	}

	/**
	 * Helper method to create DOM elements with properties
	 * This uses generics to provide type safety for different element types
	 */
	private createElement<T extends keyof HTMLElementTagNameMap>(
		tagName: T,
		properties: Partial<HTMLElementTagNameMap[T]> = {}
	): HTMLElementTagNameMap[T] {
		const element = document.createElement(tagName);

		// Apply all provided properties to the element
		Object.assign(element, properties);

		return element;
	}

	/**
	 * Creates all the stat display rows
	 * Returns an array of div elements, each containing a stat row
	 */
	private createStatRows(stats: AreaStats): HTMLDivElement[] {
		// Define the stats structure - this makes it easy to add/remove stats later
		const statsData = [
			{ label: "Boss Unlocked", value: stats.bossUnlockedThisRun ? "Yes" : "No", id: "area-boss-unlocked" },
			{ label: "Boss Killed This Run", value: stats.bossKilledThisRun ? "Yes" : "No", id: "area-boss-killed" },
			{ label: "Boss Kills", value: stats.bossKillsTotal.toString(), id: "area-boss-kills" },
			{ label: "Total Kills", value: stats.killsTotal.toString(), id: "area-total-kills" },
			{ label: "Kills This Run", value: stats.killsThisRun.toString(), id: "area-kills-this-run" },
		];

		// Map over the data to create DOM elements
		return statsData.map((stat) => this.createStatRow(stat.label, stat.value, stat.id));
	}

	/**
	 * Creates a single stat row with label and value
	 */
	private createStatRow(label: string, value: string, valueId: string): HTMLDivElement {
		const row = this.createElement("div", {
			className: "area-stat-item",
		});

		const labelSpan = this.createElement("span", {
			textContent: label,
			className: "area-stat-label",
		});

		const valueSpan = this.createElement("span", {
			id: valueId,
			textContent: value,
			className: "area-stat-value",
		});

		// Add special styling for certain values
		if (label === "Boss Unlocked" || label === "Boss Killed This Run") {
			if (value === "Yes") {
				valueSpan.style.color = "var(--success-hue)";
			} else {
				valueSpan.style.color = "var(--text-secondary)";
			}
		}

		row.appendChild(labelSpan);
		row.appendChild(valueSpan);

		return row;
	}

	/**
	 * Updates button states (enabled/disabled)
	 */
	public updateButtonState(buttonId: string, disabled: boolean): void {
		const button = document.getElementById(buttonId) as HTMLButtonElement;
		if (button) {
			button.disabled = disabled;
		} else {
			console.warn(`Button with ID '${buttonId}' not found`);
		}
	}

	private getAreaStats(): AreaStats {
		return this.context.stats.getAreaStats(this.context.hunt.getActiveAreaID());
	}
}
