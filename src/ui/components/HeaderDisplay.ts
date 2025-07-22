import { PrestigeManager } from "@/models/PrestigeManager";
import { UIBase } from "./UIBase";
import { UIButton } from "./UIButton";
import { bindEvent } from "@/shared/utils/busUtils";

export class HeaderDisplay extends UIBase {
	private playerStatsEl!: HTMLElement;
	private energyEl!: HTMLElement;
	private prestigeButton!: UIButton;

	// private energyProgressBar!: ProgressBar;

	constructor(container: HTMLElement) {
		super();
		this.element = container;
		//this.playerStatsEl = this.byId("header-player-stats");

		// Add glass effect to header
		this.element.classList.add("header-glass");
	}

	public init() {}

	public build() {
		// Header right section
		const headerRight = this.$(".header-right");
		this.playerStatsEl = document.createElement("ul");
		this.playerStatsEl.id = "header-player-stats";
		this.playerStatsEl.className = "player-stats-list";
		headerRight.appendChild(this.playerStatsEl);

		// Create stat containers with glass effect
		this.createEnergy();
		this.createGold();
		this.createRenown();
		this.createDot(headerRight);
		this.createLevel(headerRight);
		this.createDot(headerRight);
		this.createPrestigeButton(headerRight);
	}

	private createPrestigeButton(parent: HTMLElement) {
		this.prestigeButton = new UIButton(parent, {
			text: "✨ Prestige",
			className: "btn-primary glass-btn-glow",
			onClick: () => new PrestigeManager().prestige(),
			UIfeature: "feature.prestige",
		});
	}

	private createEnergy() {
		// Create glass stat card for energy
		this.energyEl = document.createElement("li");
		this.energyEl.className = "player-stat-item glass-stat-card";

		const iconContainer = document.createElement("div");
		iconContainer.className = "stat-icon-container";
		const icon = document.createElement("span");
		icon.className = "stat-icon";
		icon.textContent = "⚡";
		iconContainer.appendChild(icon);
		this.energyEl.appendChild(iconContainer);

		const contentContainer = document.createElement("div");
		contentContainer.className = "stat-content";

		const label = document.createElement("span");
		label.className = "stat-label";
		label.textContent = "Energy";
		contentContainer.appendChild(label);

		const value = document.createElement("span");
		value.className = "stat-value";
		value.textContent = "0/5";
		//value.id = "header-player-stats-energy-value";
		contentContainer.appendChild(value);

		this.energyEl.appendChild(contentContainer);
		this.playerStatsEl.appendChild(this.energyEl);

		bindEvent(this.eventBindings, "player:energy-changed", () => {
			this.updateEnergy(value);
		});
		this.updateEnergy(value);
	}

	private updateEnergy(element: HTMLElement) {
		const energy = this.context.player.energy;
		element.textContent = `${energy.current}/${energy.max}`;

		// Add glow effect when energy is full
		if (energy.current >= energy.max) {
			this.energyEl.classList.add("stat-full-glow");
		} else {
			this.energyEl.classList.remove("stat-full-glow");
		}
	}

	private createGold() {
		// Create glass stat card for gold
		const li = document.createElement("li");
		li.className = "player-stat-item glass-stat-card";

		const iconContainer = document.createElement("div");
		iconContainer.className = "stat-icon-container";
		const icon = document.createElement("span");
		icon.className = "stat-icon";
		icon.textContent = "💰";
		iconContainer.appendChild(icon);
		li.appendChild(iconContainer);

		const contentContainer = document.createElement("div");
		contentContainer.className = "stat-content";

		const label = document.createElement("span");
		label.className = "stat-label";
		label.textContent = "Gold";
		contentContainer.appendChild(label);

		const value = document.createElement("span");
		value.className = "stat-value gold-value";
		value.textContent = "0";
		contentContainer.appendChild(value);

		const income = document.createElement("span");
		income.className = "stat-income";
		income.textContent = "";
		contentContainer.appendChild(income);

		li.appendChild(contentContainer);
		this.playerStatsEl.appendChild(li);

		bindEvent(this.eventBindings, "gold:changed" as any, (payload: { amount: number; incomePerSec: number }) => {
			value.textContent = payload.amount.toLocaleString();

			if (payload.incomePerSec > 0) {
				income.textContent = `+${payload.incomePerSec.toFixed(1)}/s`;
				income.style.display = "block";
			} else {
				income.style.display = "none";
			}

			// Add sparkle effect on gold change
			//li.classList.add("gold-sparkle");
			//setTimeout(() => li.classList.remove("gold-sparkle"), 500);
		});
	}

	private createRenown() {
		// Create glass stat card for renown
		const li = document.createElement("li");
		li.className = "player-stat-item glass-stat-card";

		const iconContainer = document.createElement("div");
		iconContainer.className = "stat-icon-container";
		const icon = document.createElement("span");
		icon.className = "stat-icon";
		icon.textContent = "👑";
		iconContainer.appendChild(icon);
		li.appendChild(iconContainer);

		const contentContainer = document.createElement("div");
		contentContainer.className = "stat-content";

		const label = document.createElement("span");
		label.className = "stat-label";
		label.textContent = "Renown";
		contentContainer.appendChild(label);

		const value = document.createElement("span");
		value.className = "stat-value renown-value";
		value.textContent = "0";
		contentContainer.appendChild(value);

		li.appendChild(contentContainer);
		this.playerStatsEl.appendChild(li);

		bindEvent(this.eventBindings, "renown:changed", (amt) => {
			value.textContent = amt.toLocaleString();

			// Add pulse effect on renown gain
			li.classList.add("renown-pulse");
			setTimeout(() => li.classList.remove("renown-pulse"), 600);
		});
	}

	private createDot(parent: HTMLElement) {
		// Separator
		const dot = document.createElement("span");
		dot.className = "dot-sep glass-sep";
		dot.textContent = "•";
		parent.appendChild(dot);
	}

	private createLevel(parent: HTMLElement) {
		// Create level display with glass card
		const levelContainer = document.createElement("div");
		levelContainer.className = "level-container glass-card-mini";

		const levelIcon = document.createElement("span");
		levelIcon.className = "level-icon";
		levelIcon.textContent = "⭐";
		levelContainer.appendChild(levelIcon);

		const levelEl = document.createElement("span");
		levelEl.className = "level-text";
		levelEl.textContent = `Lvl ${this.context.player.playerLevel}`;
		levelContainer.appendChild(levelEl);

		parent.appendChild(levelContainer);

		// Listen for level changes
		bindEvent(this.eventBindings, "player:level-up", (level: number) => {
			levelEl.textContent = `Lvl ${level}`;
			// Add level up animation
			levelContainer.classList.add("level-up-animation");
			setTimeout(() => levelContainer.classList.remove("level-up-animation"), 1000);
		});
	}
}
