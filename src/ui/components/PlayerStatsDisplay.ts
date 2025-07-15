import { UIBase } from "./UIBase";
import { bindEvent } from "@/shared/utils/busUtils";
import { ProgressBar } from "./ProgressBar";
import { TableDisplay } from "./TableDisplay";
import { formatNumberShort } from "@/shared/utils/stringUtils";

export class PlayerStatsDisplay extends UIBase {
	private tableWrapper!: HTMLElement;
	private traitListEl!: HTMLElement;
	private levelNumberEl!: HTMLElement;
	private xpTextEl!: HTMLElement;
	private xpProgressBar!: ProgressBar;
	private statsTable!: TableDisplay;
	private traitTable!: TableDisplay;

	constructor(container: HTMLElement) {
		super();
		this.element = container;
		this.setupElements();
		this.createTables();
		this.setupLevelDisplay();
		this.bindEvents();

		// Add glass effect to main container
		this.element.classList.add("player-stats-glass-container");
	}

	private setupElements() {
		// Create glass panels for different sections
		this.element.innerHTML = `
            <div class="player-stats-section glass-panel">
                <div class="section-header">
                    <h3 class="section-title">
                        <span class="section-icon">📊</span>
                        Character Level
                    </h3>
                </div>
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
                        <span class="section-icon">⚔️</span>
                        Combat Stats
                    </h3>
                    <button class="toggle-btn glass-btn-mini">▼</button>
                </div>
                <div id="stats-table-wrapper" class="table-wrapper"></div>
            </div>
            
            <div class="player-stats-section glass-panel">
                <div class="section-header">
                    <h3 class="section-title">
                        <span class="section-icon">✨</span>
                        Traits
                    </h3>
                    <button class="toggle-btn glass-btn-mini">▼</button>
                </div>
                <div id="trait-list" class="trait-list-wrapper"></div>
            </div>
        `;

		this.tableWrapper = this.element.querySelector("#stats-table-wrapper")!;
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
			collapsible: true,
			className: "glass-table",
		});

		// Traits table with glass styling
		this.traitTable = new TableDisplay({
			container: this.traitListEl,
			columns: 2,
			headers: ["Trait", "Rarity"],
			banded: true,
			boldFirstColumn: true,
			collapsible: true,
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
		});

		// XP change event
		bindEvent(this.eventBindings, "player:xp-changed", (data: { current: number; max: number }) => {
			this.xpProgressBar.setMax(data.max);
			this.xpProgressBar.setValue(data.current);
			this.xpTextEl.textContent = `${formatNumberShort(data.current)} / ${formatNumberShort(data.max)} XP`;
		});

		// Stats update event
		bindEvent(this.eventBindings, "player:stats-changed", (stats: any) => {
			this.updateStatsTable(stats);
		});

		// Traits update event
		bindEvent(this.eventBindings, "player:traits-changed", (traits: any[]) => {
			this.updateTraitsTable(traits);
		});

		// Toggle buttons
		const toggleBtns = this.element.querySelectorAll(".toggle-btn");
		toggleBtns.forEach((btn) => {
			btn.addEventListener("click", (e) => {
				const section = (e.target as HTMLElement).closest(".player-stats-section");
				section?.classList.toggle("collapsed");
				(e.target as HTMLElement).textContent = section?.classList.contains("collapsed") ? "▶" : "▼";
			});
		});
	}

	private updateStatsTable(stats: any) {
		const rows: [string, string][] = [
			["Attack", `⚔️ ${formatNumberShort(stats.attack || 0)}`],
			["Defense", `🛡️ ${formatNumberShort(stats.defense || 0)}`],
			["HP", `❤️ ${formatNumberShort(stats.maxHp || 0)}`],
			["MP", `💙 ${formatNumberShort(stats.maxMp || 0)}`],
			["Speed", `💨 ${formatNumberShort(stats.speed || 0)}`],
			["Crit Chance", `⚡ ${(stats.critChance || 0).toFixed(1)}%`],
			["Crit Damage", `💥 ${(stats.critDamage || 0).toFixed(1)}%`],
		];

		this.statsTable.updateData(rows);
	}

	private updateTraitsTable(traits: any[]) {
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
}
