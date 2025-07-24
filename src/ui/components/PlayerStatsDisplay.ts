import { UIBase } from "./UIBase";
import { bindEvent } from "@/shared/utils/busUtils";
import { ProgressBar } from "./ProgressBar";
import { TableDisplay } from "./TableDisplay";
import { formatNumberShort } from "@/shared/utils/stringUtils";
import { BloodlineStats, STAT_DISPLAY_NAMES } from "@/models/Stats";

interface StatMapping {
	displayName: string;
	getValue: (stats: any) => string | number; // We'll make this more specific later
}

export class PlayerStatsDisplay extends UIBase {
	private tableWrapper!: HTMLElement;
	private bloodlineTableWrapper!: HTMLElement;
	private traitListEl!: HTMLElement;
	private levelNumberEl!: HTMLElement;
	private xpTextEl!: HTMLElement;
	private xpProgressBar!: ProgressBar;
	private statsTable!: TableDisplay;
	private bloodlineStatsTable!: TableDisplay;
	private traitTable!: TableDisplay;

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
		{ displayName: "Fire Bonus", getValue: (stats) => formatNumberShort(stats.fireBonus) || 0 },
		{ displayName: "Ice Bonus", getValue: (stats) => formatNumberShort(stats.iceBonus) || 0 },
		{ displayName: "Poison Bonus", getValue: (stats) => formatNumberShort(stats.poisonBonus) || 0 },
		{ displayName: "Lightning Bonus", getValue: (stats) => formatNumberShort(stats.lightningBonus) || 0 },
		{ displayName: "Light Bonus", getValue: (stats) => formatNumberShort(stats.lightBonus) || 0 },
		{ displayName: "Physical Bonus", getValue: (stats) => formatNumberShort(stats.physicalBonus) || 0 },
	];

	private bloodlineStatMappings: StatMapping[] = [
		{
			displayName: STAT_DISPLAY_NAMES.encounterChance,
			getValue: (stats: BloodlineStats) => formatNumberShort(stats.encounterChance) || 0,
		},
		{ displayName: STAT_DISPLAY_NAMES.vigour, getValue: (stats: BloodlineStats) => formatNumberShort(stats.vigour) || 0 },
		{ displayName: STAT_DISPLAY_NAMES.luck, getValue: (stats: BloodlineStats) => formatNumberShort(stats.luck) || 0 },
		{ displayName: STAT_DISPLAY_NAMES.classPoints, getValue: (stats: BloodlineStats) => formatNumberShort(stats.classPoints) || 0 },
	];

	constructor(container: HTMLElement) {
		super();
		this.element = container;
		this.setupElements();
		this.createTables();
		this.setupLevelDisplay();
		this.bindEvents();
		this.updateFromPlayerStats();
		this.updateBloodlineStatsTable();
		this.updateTraitDisplay();

		// Add glass effect to main container
		this.element.classList.add("player-stats-glass-container");
	}

	private setupElements() {
		// Create glass panels for different sections
		this.element.innerHTML = `
            <div class="player-stats-section glass-panel">
                <div class="level-display-container">
                    <div class="level-circle">
                        <span id="player-level-number" class="level-number">1</span>
                    </div>
                    <div class="xp-info">
                        <div id="xp-progress-container"></div>
                        <span id="xp-text" class="xp-text">0 / 100 XP</span>
                    </div>
                </div>
            </div>
            
            <div class="player-stats-section glass-panel">
                <div class="section-header">
                    <h3 class="section-title">
                        Combat Stats
                    </h3>
                </div>
                <div id="stats-table-wrapper" class="table-wrapper"></div>
            </div>
            
            <div class="player-stats-section glass-panel">
                <div class="section-header">
                    <h3 class="section-title">
                        Bloodline Stats
                    </h3>
                </div>
                <div id="bloodline-stats-table-wrapper" class="table-wrapper"></div>
            </div>
            
            <div class="player-stats-section glass-panel">
                <div class="section-header">
                    <h3 class="section-title">
                        Traits
                    </h3>
                </div>
                <div id="trait-list" class="trait-list-wrapper"></div>
            </div>
        `;

		this.tableWrapper = this.element.querySelector("#stats-table-wrapper")!;
		this.bloodlineTableWrapper = this.element.querySelector("#bloodline-stats-table-wrapper")!;
		this.traitListEl = this.element.querySelector("#trait-list")!;
	}

	private createTables() {
		// Stats table with glass styling
		this.statsTable = new TableDisplay({
			container: this.tableWrapper,
			columns: 2,
			headers: ["Stat", "Value"],
			banded: true,
			boldFirstColumn: true,
			collapsible: false,
			className: "glass-table",
		});

		// Bloodline stats table with glass styling
		this.bloodlineStatsTable = new TableDisplay({
			container: this.bloodlineTableWrapper,
			columns: 2,
			headers: ["Stat", "Value"],
			banded: true,
			boldFirstColumn: true,
			collapsible: false,
			className: "glass-table",
		});

		// Traits table with glass styling
		this.traitTable = new TableDisplay({
			container: this.traitListEl,
			columns: 2,
			headers: ["Trait", "Rarity"],
			banded: true,
			boldFirstColumn: true,
			collapsible: false,
			className: "glass-table",
		});
	}

	private setupLevelDisplay() {
		// Cache DOM elements
		this.levelNumberEl = this.element.querySelector("#player-level-number")!;
		this.xpTextEl = this.element.querySelector("#xp-text")!;

		// Create XP progress bar with glass effect
		const progressContainer = this.element.querySelector("#xp-progress-container")!;
		this.xpProgressBar = new ProgressBar({
			container: progressContainer as HTMLElement,
			maxValue: 100,
			initialValue: 0,
			smooth: true,
			color: "blue",
		});
	}

	private bindEvents() {
		// Level up event with animation
		bindEvent(this.eventBindings, "player:level-up", (level: number) => {
			this.levelNumberEl.textContent = level.toString();

			// Add level up animation
			const levelCircle = this.element.querySelector(".level-circle") as HTMLElement;
			levelCircle.classList.add("level-up-burst");
			setTimeout(() => levelCircle.classList.remove("level-up-burst"), 1000);
			this.updateLevelDisplay();
		});

		// XP change event
		bindEvent(this.eventBindings, "char:XPChanged", (amt: number) => {
			this.updateLevelDisplay();
		});

		// Stats update event
		bindEvent(this.eventBindings, "player:statsChanged", (stats: any) => {
			this.updateStatsTable();
		});

		// Traits update event
		bindEvent(this.eventBindings, "game:prestige", () => {
			this.updateStatsTable();
			this.updateTraitDisplay();
			this.updateTraitsTable();
			this.updateLevelDisplay();
		});

		/* 		bindEvent(this.eventBindings, "Game:UITick", () => {
			this.updateLevelDisplay();
		}); */

		bindEvent(this.eventBindings, "game:gameReady", () => {
			this.updateLevelDisplay();
			this.updateTraitDisplay();
			this.updateBloodlineStatsTable();
			this.updateTraitsTable();
		});

		// Listen for bloodline stats changes (class points, etc.)
		bindEvent(this.eventBindings, "classes:pointsChanged", () => {
			this.updateBloodlineStatsTable();
		});

		// Toggle buttons
		/* 		const toggleBtns = this.element.querySelectorAll(".toggle-btn");
		toggleBtns.forEach((btn) => {
			btn.addEventListener("click", (e) => {
				const section = (e.target as HTMLElement).closest(".player-stats-section");
				section?.classList.toggle("collapsed");
				(e.target as HTMLElement).textContent = section?.classList.contains("collapsed") ? "▶" : "▼";
			});
		}); */
	}

	private updateTraitsTable() {
		if (!this.context.character) return;
		const traits = this.context.character.getTraits();
		const rows: [string, string][] = traits.map((trait) => {
			const rarityClass = `rarity-${trait.rarity}`;
			const rarityIcon = this.getRarityIcon(trait.rarity);
			return [trait.name, `<span class="${rarityClass}">${rarityIcon} ${trait.rarity}</span>`];
		});

		this.traitTable.updateData(rows);
	}

	private getRarityIcon(rarity: string): string {
		const icons: Record<string, string> = {
			common: "⚪",
			uncommon: "🟢",
			rare: "🔵",
			epic: "🟣",
			legendary: "🟡",
			mythic: "🔴",
		};
		return icons[rarity.toLowerCase()] || "⚪";
	}

	private updateFromPlayerStats() {
		if (!this.context.currentRun) return;
		this.updateStatsTable();
		this.updateBloodlineStatsTable();
		this.updateTraitDisplay();
	}

	// Update multiple stats at once
	public updateStatsTable() {
		if (!this.context.currentRun) return;

		const character = this.context.character;
		const stats = character.statsEngine.getAll();
		this.statsTable.updateData(this.statMappings.map((stat) => [stat.displayName, stat.getValue(stats)]));
	}

	// Update bloodline stats table
	public updateBloodlineStatsTable() {
		if (!this.context.player) return;

		const bloodlineStats = this.context.player.bloodlineStatsData;
		this.bloodlineStatsTable.updateData(this.bloodlineStatMappings.map((stat) => [stat.displayName, stat.getValue(bloodlineStats)]));
	}

	private updateTraitDisplay() {
		const traits = this.context.character.getTraits();
		this.traitTable.updateData(traits.map((t) => [t.name, t.rarity]));
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
		this.xpTextEl.textContent = `${formatNumberShort(currentXP, 0, true)} / ${formatNumberShort(xpForNextLevel, 0, true)} XP`;
	}
}
