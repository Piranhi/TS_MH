import { Bounded } from "../domain/value-objects/Bounded";
import { bus, EventKey } from "../EventBus";
import { UIStat } from "./UIStat";

export class Playerbar {
	constructor(private container: HTMLElement) {}
	private PlayerStatsEl: HTMLUListElement = document.querySelector(".player-stats")!;

	public build() {

		const level = new UIStat(
			"Level",
			"player:level-up",
			this.PlayerStatsEl,
			"stat-num-template",
			(payload, {valueEl}) => {
				valueEl.textContent = payload.toString()
			}
		).init();

		const stamina = new UIStat(
			"Stamina",
			"player:stamina-changed",
			this.PlayerStatsEl,
			"stat-bar-template",
			(payload, {valueEl, fillEl}) => {
				const curr = Math.floor(payload.current);
				const mx = Math.floor(payload.max);
				valueEl.textContent = `${curr} / ${mx}`;
				if(fillEl){
					const pct = mx > 0 ? (curr/mx) * 100 : 0;
					fillEl.style.setProperty("--value", String(pct));
				}
			}
		).init();

		const renown = new UIStat(
			"Renown",
			"Renown:Changed",
			this.PlayerStatsEl,
			"stat-bar-template",
			(payload, {valueEl, fillEl}) => {
				const curr = Math.floor(payload.current);
				const mx = Math.floor(payload.max);
				valueEl.textContent = `${curr} / ${mx}`;

				if(fillEl){
					const pct = mx > 0? (curr/mx) * 100 : 0;
					fillEl.style.setProperty("--value", `${pct}%`)
				}
			}
		).init();
	}

}
