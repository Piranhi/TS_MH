import { PrestigeManager } from "@/models/PrestigeManager";
import { StatDisplay } from "./StatDisplay";
import { UIBase } from "./UIBase";
import { bindEvent } from "@/shared/utils/busUtils";
import { ProgressBar } from "./ProgressBar";
import { bus } from "@/core/EventBus";

export class HeaderDisplay extends UIBase {
	private PlayerStatsEl: HTMLElement;
	private prestigeButton!: HTMLButtonElement;
	private staminaProgressBar!: ProgressBar;
	constructor(container: HTMLElement) {
		super();
		this.element = container;
		this.PlayerStatsEl = this.byId("header-player-stats"); // document.getElementById("header-player-stats")!;
		this.prestigeButton = this.byId("prestige-button") as HTMLButtonElement;
		bindEvent(this.eventBindings, "game:prestige", () => this.handlePrestige());
		this.prestigeButton.addEventListener("click", () => new PrestigeManager().prestige());
	}

	public init() {}

	public build() {
		this.PlayerStatsEl.innerHTML = "";
		this.createStamina();
		this.createRenown();
	}

	private createStamina() {
		// Add Stamina
		const li = document.createElement("li");
		li.className = "player-stats";
		const label = document.createElement("span");
		label.className = "label";
		label.textContent = "Stamina";
		li.appendChild(label);

		this.staminaProgressBar = new ProgressBar({
			container: li,
			templateId: "progress-bar-template",
			maxValue: 250,
			initialValue: 45,
		});
		const value = document.createElement("span");
		value.className = "value";
		value.textContent = "55/100";
		li.appendChild(value);
		this.PlayerStatsEl.appendChild(li);

		bus.on("player:stamina-changed", (payload) => {
			const curr = Math.floor(payload.current);
			const mx = Math.floor(payload.max);
			value.textContent = `${curr} / ${mx}`;
			//console.log(payload);
			this.staminaProgressBar.setMax(payload.max);
			this.staminaProgressBar.setValue(Math.floor(payload.current));
			//this.staminaProgressBar.
		});
	}
	private createRenown() {
		// Add Renown
		const li = document.createElement("li");
		li.className = "player-stats";
		const label = document.createElement("span");
		label.className = "label";
		label.textContent = "Renown";
		li.appendChild(label);
		const value = document.createElement("span");
		value.className = "value";
		value.textContent = "0";
		li.appendChild(value);
		this.PlayerStatsEl.appendChild(li);
		bus.on("renown:changed", (amt) => {
			value.textContent = amt.toString();
		});
	}

	private handlePrestige() {}
}
