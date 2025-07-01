import { Stats } from "@/models/Stats";
import { UIBase } from "./UIBase";
import { bindEvent } from "@/shared/utils/busUtils";
import { formatNumberShort, prettify } from "@/shared/utils/stringUtils";
import { calculateRawBaseDamage } from "@/shared/utils/stat-utils";
import { ProgressBar } from "./ProgressBar";

interface StatData {
	name: string;
	value: string | number;
}

export class PlayerStatsDisplay extends UIBase {
	private tableBody!: HTMLTableSectionElement;
	private levelNumberEl!: HTMLElement;
	private xpTextEl!: HTMLElement;
	private xpProgressBar!: ProgressBar;
	private traitListEl!: HTMLUListElement;

	private statsData: StatData[] = [
		{ name: "Attack", value: 0 },
		{ name: "Defence", value: 0 },
		{ name: "Health", value: 0 },
		{ name: "Speed", value: 0 },
		{ name: "CritChance", value: 0 },
		{ name: "CritDamage", value: 0 },
		{ name: "Evasion", value: 0 },
		{ name: "Encounter Chance", value: 0 },
		{ name: "Fire Bonus", value: 0 },
		{ name: "Ice Bonus", value: 0 },
		{ name: "Poison Bonus", value: 0 },
		{ name: "Lightning Bonus", value: 0 },
		{ name: "Light Bonus", value: 0 },
		{ name: "Physical Bonus", value: 0 },
	];

	constructor(container: HTMLElement) {
		super();
		this.element = container;
		this.createTable();
		this.bindEvents();
	}

	private createTable() {
		this.element.innerHTML = `
        <div class="stats-container">
            <!-- Player Level Section -->
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
            
            <div class="basic-table-wrapper">
                <table class="basic-table">
                    <thead>
                        <tr>
                            <th>Stat</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
            <div class="trait-section">
                <h3 class="basic-subtitle">Traits</h3>
				<ul id="trait-list" class="basic-list"></ul>
            </div>
        </div>
    `;

		this.tableBody = this.element.querySelector("tbody")!;
		this.traitListEl = this.element.querySelector("#trait-list")!;
		this.setupLevelDisplay();
		this.renderStats();
		this.updateTraitDisplay();
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

	private renderStats() {
		// Clear existing rows
		this.tableBody.innerHTML = "";

		// Create rows for each stat
		this.statsData.forEach((stat) => {
			const row = document.createElement("tr");
			row.innerHTML = `
                <td class="basic-stat-name">${stat.name}</td>
                <td class="basic-stat-value" data-stat="${stat.name}">${stat.value}</td>
            `;
			this.tableBody.appendChild(row);
		});
	}

	// Update a single stat
	public updateStat(statName: string, value: string | number) {
		// Update in data array
		const statIndex = this.statsData.findIndex((stat) => stat.name === statName);
		if (statIndex !== -1) {
			this.statsData[statIndex].value = value;

			// Update DOM element
			const valueCell = this.element.querySelector(`[data-stat="${statName}"]`);
			if (valueCell) {
				valueCell.textContent = value.toString();
			}
		}
	}

	// Update multiple stats at once
	public updateStats(updates: Record<string, string | number>) {
		Object.entries(updates).forEach(([statName, value]) => {
			this.updateStat(statName, value);
		});
	}

	private updateTraitDisplay() {
		const traits = this.context.character.getTraits();
		this.traitListEl.innerHTML = "";
		traits.forEach((t) => {
			const li = document.createElement("li");
			li.textContent = `${t.name} (${t.rarity})`;
			this.traitListEl.appendChild(li);
			li.classList.add("basic-list-item");
		});
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
		bindEvent(this.eventBindings, "gameRun:started", () => {
			this.updateTraitDisplay();
		});
	}

	private updateFromPlayerStats() {
		if (!this.context.currentRun) return;

		const character = this.context.character;
		const stats = character.statsEngine.getAll();

		// Map your game stats to display stats
		this.updateStats({
			Attack: formatNumberShort(stats.attack) || 0,
			Defence: formatNumberShort(stats.defence) || 0,
			Health: formatNumberShort(character.maxHp) || 0,
			Speed: formatNumberShort(stats.speed) || 0,
			Evasion: formatNumberShort(stats.evasion) || 0,
			CritChance: formatNumberShort(stats.critChance) || 0,
			CritDamage: formatNumberShort(stats.critDamage) || 0,
			EncounterChance: formatNumberShort(stats.encounterChance) || 0,
			FireBonus: formatNumberShort(stats.fireBonus) || 0,
			IceBonus: formatNumberShort(stats.iceBonus) || 0,
			PoisonBonus: formatNumberShort(stats.poisonBonus) || 0,
			LightningBonus: formatNumberShort(stats.lightningBonus) || 0,
			LightBonus: formatNumberShort(stats.lightBonus) || 0,
			PhysicalBonus: formatNumberShort(stats.physicalBonus) || 0,
		});
		this.updateTraitDisplay();
	}

	// Clean up when component is destroyed
	public destroy() {
		if (this.xpProgressBar) {
			this.xpProgressBar.destroy();
		}
		super.destroy();
	}
}
