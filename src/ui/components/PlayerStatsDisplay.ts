import { UIBase } from "./UIBase";
import { bindEvent } from "@/shared/utils/busUtils";
import { formatNumberShort, prettify } from "@/shared/utils/stringUtils";
import { ProgressBar } from "./ProgressBar";
import { TableDisplay } from "./TableDisplay";

interface StatMapping {
	displayName: string;
	getValue: (stats: any) => string | number; // We'll make this more specific later
}

export class PlayerStatsDisplay extends UIBase {
	private levelNumberEl!: HTMLElement;
	private xpTextEl!: HTMLElement;
	private xpProgressBar!: ProgressBar;
	private traitListEl!: HTMLUListElement;
	private tableWrapper!: HTMLElement;
	private statsTable!: TableDisplay;
	private traitTable!: TableDisplay;

	// Then create your stat mappings
	private statMappings: StatMapping[] = [
		{ displayName: "Attack", getValue: (stats) => formatNumberShort(stats.attack) || 0 },
		{ displayName: "Defence", getValue: (stats) => formatNumberShort(stats.defence) || 0 },
		{ displayName: "Health", getValue: (stats) => formatNumberShort(stats.hp) || 0 },
		{ displayName: "Regen", getValue: (stats) => formatNumberShort(stats.regen) || 0 },
		{ displayName: "Lifesteal", getValue: (stats) => formatNumberShort(stats.lifesteal) || 0 },
		{ displayName: "Speed", getValue: (stats) => formatNumberShort(stats.speed) || 0 },
		{ displayName: "Crit Chance", getValue: (stats) => formatNumberShort(stats.critChance) || 0 },
		{ displayName: "Crit Damage", getValue: (stats) => formatNumberShort(stats.critDamage) || 0 },
		{ displayName: "Evasion", getValue: (stats) => formatNumberShort(stats.evasion) || 0 },
		{ displayName: "Encounter Chance", getValue: (stats) => formatNumberShort(stats.encounterChance) || 0 },
		{ displayName: "Fire Bonus", getValue: (stats) => formatNumberShort(stats.fireBonus) || 0 },
		{ displayName: "Ice Bonus", getValue: (stats) => formatNumberShort(stats.iceBonus) || 0 },
		{ displayName: "Poison Bonus", getValue: (stats) => formatNumberShort(stats.poisonBonus) || 0 },
		{ displayName: "Lightning Bonus", getValue: (stats) => formatNumberShort(stats.lightningBonus) || 0 },
		{ displayName: "Light Bonus", getValue: (stats) => formatNumberShort(stats.lightBonus) || 0 },
		{ displayName: "Physical Bonus", getValue: (stats) => formatNumberShort(stats.physicalBonus) || 0 },
	];

	constructor(container: HTMLElement) {
		super();
		this.element = container;
		this.createElements();
		this.setupLevelDisplay();
		this.createTables();
		this.bindEvents();
		this.updateFromPlayerStats();
		this.updateTraitDisplay();
	}

	private createElements() {
		this.element.innerHTML = `
        <div class="stats-container">

			<h2 class="basic-subtitle">Level</h2>
            <div class="player-level-section">
                <div class="level-display">
                    <span class="level-text">Lvl</span>
                    <span class="level-number" id="player-level-number">1</span>
                </div>
                <div class="xp-progress-container" id="xp-progress-container">
                    <!-- ProgressBarSimple will be inserted here -->
                </div>
                <div class="xp-text" id="xp-text">0 / 100 XP</div>
            </div>
                            <h2 class="basic-subtitle">Stats</h2>
            <div class="basic-table-wrapper" id="stats-table">
			</div>
		<h2 class="basic-subtitle">Traits</h2>
            <div class="trait-section">
				<ul id="trait-list" class="basic-list"></ul>
            </div>
        </div>`;
		this.tableWrapper = this.element.querySelector("#stats-table")!;
		this.traitListEl = this.element.querySelector("#trait-list")!;
	}

	private createTables() {
		this.statsTable = new TableDisplay({
			container: this.tableWrapper,
			columns: 2,
			headers: ["Stat", "Value"],
			banded: true,
			boldFirstColumn: true,
			collapsible: true,
		});

		this.traitTable = new TableDisplay({
			container: this.traitListEl,
			columns: 2,
			headers: ["Trait", "Rarity"],
			banded: true,
			boldFirstColumn: true,
			collapsible: true,
		});
	}

	private setupLevelDisplay() {
		// Cache DOM elements
		this.levelNumberEl = this.element.querySelector("#player-level-number")!;
		this.xpTextEl = this.element.querySelector("#xp-text")!;

		// Create XP progress bar
		const progressContainer = this.element.querySelector("#xp-progress-container")!;
		this.xpProgressBar = new ProgressBar({
			container: progressContainer as HTMLElement,
			maxValue: 100,
			initialValue: 0,
		});

		// Initial update
		this.updateLevelDisplay();
	}

	private updateLevelDisplay() {
		const char = this.context.character;
		const currentLevel = char.level;
		const currentXP = char.currentXp;
		const xpForNextLevel = char.nextXpThreshold;

		// Update level number
		this.levelNumberEl.textContent = currentLevel.toString();

		// Update XP progress bar
		this.xpProgressBar.setMax(xpForNextLevel);
		this.xpProgressBar.setValue(currentXP);

		// Update XP text
		this.xpTextEl.textContent = `${formatNumberShort(currentXP)} / ${formatNumberShort(xpForNextLevel)} XP`;
	}

	// Integration with your game's event system
	private bindEvents() {
		// Listen for stat changes
		bindEvent(this.eventBindings, "player:statsChanged", () => {
			this.updateFromPlayerStats();
		});

		// Listen for level changes
		bindEvent(this.eventBindings, "char:gainedXp", () => {
			this.updateLevelDisplay();
		});

		// Listen for any game tick to update XP (in case XP changes without leveling)
		bindEvent(this.eventBindings, "Game:UITick", () => {
			this.updateLevelDisplay();
		});
		bindEvent(this.eventBindings, "game:gameReady", () => {
			this.updateTraitDisplay();
		});
	}

	private updateFromPlayerStats() {
		if (!this.context.currentRun) return;
		this.updateStatsTable();
		this.updateTraitDisplay();
	}

	// Update multiple stats at once
	public updateStatsTable() {
		if (!this.context.currentRun) return;

		const character = this.context.character;
		const stats = character.statsEngine.getAll();
		this.statsTable.setRows(this.statMappings.map((stat) => [stat.displayName, stat.getValue(stats)]));
	}

	private updateTraitDisplay() {
		const traits = this.context.character.getTraits();
		this.traitTable.setRows(traits.map((t) => [t.name, t.rarity]));
		/* 		this.traitListEl.innerHTML = "";
		traits.forEach((t) => {
			const li = document.createElement("li");
			li.textContent = `${t.name} (${t.rarity})`;
			this.traitListEl.appendChild(li);
			li.classList.add("basic-list-item");
		}); */
	}

	// Clean up when component is destroyed
	public destroy() {
		if (this.xpProgressBar) {
			this.xpProgressBar.destroy();
		}
		if (this.statsTable) {
			this.statsTable.destroy();
		}
		super.destroy();
	}
}
