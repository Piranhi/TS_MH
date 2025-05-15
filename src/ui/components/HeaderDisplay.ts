import { StatDisplay } from "./StatDisplay";

export class HeaderDisplay {
	private PlayerStatsEl: HTMLElement;
	constructor(private container: HTMLElement) {
		this.PlayerStatsEl = document.getElementById("header-player-stats")!;
	}

	public build() {
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
}
