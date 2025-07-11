import { PrestigeManager } from "@/models/PrestigeManager";
import { UIBase } from "./UIBase";
import { bindEvent } from "@/shared/utils/busUtils";
import { bus } from "@/core/EventBus";
import { ProgressBar } from "./ProgressBar";
import { UIButton } from "./UIButton";

export class HeaderDisplay extends UIBase {
	private PlayerStatsEl: HTMLElement;
	private energyProgressBar!: ProgressBar;
	private levelEl: HTMLElement;
	constructor(container: HTMLElement) {
		super();
		this.element = container;
		this.PlayerStatsEl = this.byId("header-player-stats");
	}

	public init() {}

	public build() {
		this.PlayerStatsEl.innerHTML = "";
		this.createEnergy();
		this.createGold();
		this.createRenown();
		const headerRight = this.$(".header-right");
		const levelEl = document.createElement("span");
		levelEl.className = "basic-text";
		levelEl.textContent = `Lvl ${this.context.player.playerLevel}`;
		headerRight.appendChild(levelEl);
		const dot = document.createElement("span");
		dot.className = "dot-sep";
		dot.textContent = "•";
		headerRight.appendChild(dot);
		const prestigeButton = new UIButton(headerRight, {
			text: "Prestige",
			onClick: () => new PrestigeManager().prestige(),
		});
	}

	private createEnergy() {
		// Add Energy
		const li = document.createElement("li");
		li.className = "player-stats";
		const label = document.createElement("span");
		label.className = "basic-text-light";
		label.textContent = "Energy";
		li.appendChild(label);

		this.energyProgressBar = new ProgressBar({
			container: li,
			maxValue: 250,
			initialValue: 45,
			smooth: true,
		});
		const value = document.createElement("span");
		value.className = "basic-text-stat";
		value.textContent = "55/100";
		li.appendChild(value);
		this.PlayerStatsEl.appendChild(li);

		bus.on("player:energy-changed", (payload) => {
			const curr = Math.floor(payload.current);
			const mx = Math.floor(payload.max);
			value.textContent = `${curr} / ${mx}`;
			this.energyProgressBar.setMax(payload.max);
			this.energyProgressBar.setValue(Math.floor(payload.current));
		});
	}
	private createGold() {
		// Add Gold
		const li = document.createElement("li");
		li.className = "player-stats";
		const label = document.createElement("span");
		label.className = "basic-text-light";
		label.textContent = "Gold";
		li.appendChild(label);
		const value = document.createElement("span");
		value.className = "basic-text-stat";
		value.textContent = "0";
		li.appendChild(value);
		this.PlayerStatsEl.appendChild(li);

		bus.on("gold:changed" as any, (payload: { amount: number; incomePerSec: number }) => {
			const incomeStr = payload.incomePerSec > 0 ? ` (+${payload.incomePerSec.toFixed(1)}/s)` : "";
			value.textContent = `${payload.amount}${incomeStr}`;
		});
	}
	private createRenown() {
		// Add Renown
		const li = document.createElement("li");
		li.className = "player-stats";
		const label = document.createElement("span");
		label.className = "basic-text-light";
		label.textContent = "Renown";
		li.appendChild(label);
		const value = document.createElement("span");
		value.className = "basic-text-stat";
		value.textContent = "0";
		li.appendChild(value);
		this.PlayerStatsEl.appendChild(li);
		bus.on("renown:changed", (amt) => {
			value.textContent = amt.toString();
		});
	}
}
