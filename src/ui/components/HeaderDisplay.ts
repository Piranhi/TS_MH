import { PrestigeManager } from "@/models/PrestigeManager";
import { StatDisplay } from "./StatDisplay";
import { UIBase } from "./UIBase";
import { bindEvent } from "@/shared/utils/busUtils";

export class HeaderDisplay extends UIBase {
	private PlayerStatsEl: HTMLElement;
	private prestigeButton!: HTMLButtonElement;
	constructor(container: HTMLElement) {
		super();
		this.element = container;
		this.PlayerStatsEl = this.byId("header-player-stats"); // document.getElementById("header-player-stats")!;
		this.prestigeButton = this.byId("prestige-button") as HTMLButtonElement;
		bindEvent(this.eventBindings, "game:prestige", () => this.handlePrestige());
		this.prestigeButton.addEventListener("click", () => new PrestigeManager().prestige());
	}

	public init() {
		const stamina = new StatDisplay(
			"Stamina",
			"player:stamina-changed",
			this.PlayerStatsEl,
			"stat-bar-template",
			(payload, { valueEl, fillEl }) => {
				const curr = Math.floor(payload.current);
				const mx = Math.floor(payload.max);
				valueEl.textContent = `${curr} / ${mx}`;
				if (fillEl) {
					const pct = mx > 0 ? (curr / mx) * 100 : 0;
					fillEl.style.setProperty("--value", String(pct));
				}
			}
		).init();

		const renown = new StatDisplay("Renown", "renown:changed", this.PlayerStatsEl, "stat-num-template", (payload, { valueEl }) => {
			valueEl.textContent = payload.toString();
		}).init();
	}

	public build() {}

	private handlePrestige() {}
}
