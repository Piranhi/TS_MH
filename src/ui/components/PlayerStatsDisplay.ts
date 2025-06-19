import { Stats } from "@/models/Stats";
import { UIBase } from "./UIBase";
import { bindEvent } from "@/shared/utils/busUtils";
import { prettify } from "@/shared/utils/stringUtils";
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
		{ name: "Strength", value: 0 },
		{ name: "Power", value: 0 },
		{ name: "CritChance", value: 0 },
		{ name: "CritDamage", value: 0 },
		{ name: "Defence", value: 0 },
		{ name: "Guard", value: 0 },
		{ name: "Evasion", value: 0 },
		{ name: "Health", value: 0 },
		{ name: "Speed", value: 0 },
		{ name: "Encounter Chance", value: 0 },
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
            
            <div class="table-wrapper">
                <table class="stats-table">
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
                <h3>Traits</h3>
                <ul class="trait-list" id="trait-list"></ul>
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
		this.xpTextEl.textContent = `${currentXP} / ${xpForNextLevel} XP`;
	}

	private renderStats() {
		// Clear existing rows
		this.tableBody.innerHTML = "";

		// Create rows for each stat
		this.statsData.forEach((stat) => {
			const row = document.createElement("tr");
			row.innerHTML = `
                <td class="stat-name">${stat.name}</td>
                <td class="stat-value" data-stat="${stat.name}">${stat.value}</td>
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
                        li.textContent = `${t.name} (${t.rarity}) - ${t.description}`;
                        this.traitListEl.appendChild(li);
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
                        Strength: stats.attack.toPrecision(2) || 0,
                        Power: stats.power.toPrecision(2) || 0,
			Defence: stats.defence.toPrecision(2) || 0,
			Health: character.maxHp.toString() || 0,
			Guard: stats.guard.toPrecision(2) || 0,
			Speed: stats.speed.toPrecision(2) || 0,
			Evasion: stats.evasion.toPrecision(2) || 0,
                        CritChance: stats.critChance.toPrecision(2) || 0,
                        CritDamage: stats.critDamage.toPrecision(2) || 0,
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
