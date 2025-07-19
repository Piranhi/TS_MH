import { PrestigeManager } from "@/models/PrestigeManager";
import { UIBase } from "./UIBase";
import { bus } from "@/core/EventBus";
import { ProgressBar } from "./ProgressBar";
import { UIButton } from "./UIButton";
import { bindEvent } from "@/shared/utils/busUtils";

export class HeaderDisplay extends UIBase {
	private PlayerStatsEl: HTMLElement;
	// private energyProgressBar!: ProgressBar;

	constructor(container: HTMLElement) {
		super();
		this.element = container;
		this.PlayerStatsEl = this.byId("header-player-stats");

		// Add glass effect to header
		this.element.classList.add("header-glass");
	}

	public init() {}

	public build() {
		this.PlayerStatsEl.innerHTML = "";
		this.PlayerStatsEl.className = "player-stats-list";

		// Create stat containers with glass effect
		this.createEnergy();
		this.createGold();
		this.createRenown();

		// Header right section
		const headerRight = this.$(".header-right");

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

		headerRight.appendChild(levelContainer);

		// Separator
		const dot = document.createElement("span");
		dot.className = "dot-sep glass-sep";
		dot.textContent = "•";
		headerRight.appendChild(dot);

		// Prestige button with glass effect
		const prestigeButton = new UIButton(headerRight, {
			text: "✨ Prestige",
			className: "btn-primary glass-btn-glow",
			onClick: () => new PrestigeManager().prestige(),
		});

		// Listen for level changes
		bindEvent(this.eventBindings, "player:level-up", (level: number) => {
			levelEl.textContent = `Lvl ${level}`;
			// Add level up animation
			levelContainer.classList.add("level-up-animation");
			setTimeout(() => levelContainer.classList.remove("level-up-animation"), 1000);
		});
	}

	private createEnergy() {
		// Create glass stat card for energy
		const li = document.createElement("li");
		li.className = "player-stat-item glass-stat-card";

		const iconContainer = document.createElement("div");
		iconContainer.className = "stat-icon-container";
		const icon = document.createElement("span");
		icon.className = "stat-icon";
		icon.textContent = "⚡";
		iconContainer.appendChild(icon);
		li.appendChild(iconContainer);

		const contentContainer = document.createElement("div");
		contentContainer.className = "stat-content";

		const label = document.createElement("span");
		label.className = "stat-label";
		label.textContent = "Stamina";
		contentContainer.appendChild(label);

		// Progress bar container
		const progressContainer = document.createElement("div");
		progressContainer.className = "stat-progress-container";

		/* 		this.energyProgressBar = new ProgressBar({
			container: progressContainer,
			maxValue: 100,
			initialValue: 0,
			smooth: true,
			color: "yellow", // Energy color
		});

		contentContainer.appendChild(progressContainer); */

		const value = document.createElement("span");
		value.className = "stat-value";
		value.textContent = "0/100";
		contentContainer.appendChild(value);

		li.appendChild(contentContainer);
		this.PlayerStatsEl.appendChild(li);

		bindEvent(this.eventBindings, "player:energy-changed", (payload) => {
			const curr = Math.floor(payload.current);
			const mx = Math.floor(payload.max);
			value.textContent = `${curr}/${mx}`;
			// this.energyProgressBar.setMax(payload.max);
			// this.energyProgressBar.setValue(Math.floor(payload.current));

			// Add glow effect when energy is full
			if (curr >= mx) {
				li.classList.add("stat-full-glow");
			} else {
				li.classList.remove("stat-full-glow");
			}
		});
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
		this.PlayerStatsEl.appendChild(li);

		bindEvent(this.eventBindings, "gold:changed" as any, (payload: { amount: number; incomePerSec: number }) => {
			value.textContent = payload.amount.toLocaleString();

			if (payload.incomePerSec > 0) {
				income.textContent = `+${payload.incomePerSec.toFixed(1)}/s`;
				income.style.display = "block";
			} else {
				income.style.display = "none";
			}

			// Add sparkle effect on gold change
			li.classList.add("gold-sparkle");
			setTimeout(() => li.classList.remove("gold-sparkle"), 500);
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
		this.PlayerStatsEl.appendChild(li);

		bindEvent(this.eventBindings, "renown:changed", (amt) => {
			value.textContent = amt.toLocaleString();

			// Add pulse effect on renown gain
			li.classList.add("renown-pulse");
			setTimeout(() => li.classList.remove("renown-pulse"), 600);
		});
	}
}
