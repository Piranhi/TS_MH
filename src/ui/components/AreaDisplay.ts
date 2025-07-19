import { bindEvent } from "@/shared/utils/busUtils";
import { UIBase } from "./UIBase";
import { AreaStats } from "@/shared/stats-types";
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
		OPTIONS: "area-options",
	} as const;

	private fightBossBtn!: UIButton;
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

		const statsDiv = this.createElement("div", {
			id: AreaDisplay.DOM_IDS.STATS_ROWS,
		});

		// Container for extra options like auto progression
		this.optionsContainer = this.createElement("div", {
			id: AreaDisplay.DOM_IDS.OPTIONS,
			className: "area-options",
		});

		// Create auto advance checkbox
		this.createAutoAdvanceCheckbox();

		// Create fight boss button
		this.fightBossBtn = new UIButton(this.optionsContainer, {
			text: "Fight Boss",
			disabled: true,
			id: AreaDisplay.DOM_IDS.FIGHT_BOSS_BTN,
			onClick: this.onFightBoss,
		});

		// Assemble the section
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

			const container = this.$(`#${AreaDisplay.DOM_IDS.STATS_ROWS}`) as HTMLDivElement;
			container.innerHTML = "<h3 style='margin: 0 0 1rem 0;'>Area Progress</h3>";

			// Create stat rows using our helper method
			const statRows = this.createStatRows(stats);

			// Add all stat rows
			statRows.forEach((row) => container.appendChild(row));
		} catch (e) {
			console.error("Error updating area stats", e);
		}
	}

	/**
	 * Calculates area completion percentage based on progress toward boss unlock
	 */
	private calculateCompletionPercentage(stats: AreaStats): string {
		const killsNeeded = GAME_BALANCE.hunt.enemiesNeededForBoss;
		const killsProgress = Math.min(stats.killsThisRun, killsNeeded);
		const baseProgress = (killsProgress / killsNeeded) * 100;
		
		// If boss is killed this run, add bonus completion
		const bossBonus = stats.bossKilledThisRun ? 20 : 0;
		
		const totalCompletion = Math.min(100, baseProgress + bossBonus);
		return `${Math.round(totalCompletion)}%`;
	}

	/**
	 * Gets the area level range for display
	 */
	private getAreaLevelRange(): string {
		const activeArea = this.context.hunt.getActiveArea();
		if (!activeArea) return "1-5";
		
		// For now, return a basic level range. This could be enhanced later
		// to use actual area data if available
		return `${activeArea.minLevel || 1}-${activeArea.maxLevel || 5}`;
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
			{ label: "Monsters Killed", value: `${stats.killsThisRun} / ${GAME_BALANCE.hunt.enemiesNeededForBoss}`, id: "area-monsters-killed" },
			{ label: "Boss Unlocked", value: stats.bossUnlockedThisRun ? "Yes" : "No", id: "area-boss-unlocked" },
			{ label: "Completion", value: this.calculateCompletionPercentage(stats), id: "area-completion" },
			{ label: "Area Level", value: this.getAreaLevelRange(), id: "area-level" },
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
		if (label === "Boss Unlocked") {
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
