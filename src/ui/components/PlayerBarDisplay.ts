import { Bounded } from "../../models/value-objects/Bounded";
import { bus, EventKey } from "../../core/EventBus";
import { StatDisplay } from "./StatDisplay";
import { PlayerStats } from "@/models/Stats";
import { Player } from "@/models/player";

export class PlayerbarDisplay {
	constructor(private container: HTMLElement) {}
	private PlayerStatsEl: HTMLUListElement = document.querySelector(".player-stats")!;

	private coreKeys: (keyof PlayerStats)[] = ["attack", "defence", "speed", "maxHp"]
	private extraKeys: (keyof PlayerStats)[] = ["attackFlat", "defenceFlat", "critChance", "critDamage", "lifesteal"]

	  private sectionOpen: Record<string, boolean> = {
    "Core Stats":  true,  // default open
    "Extra Stats": true,
  };

	public build() {

		const level = new StatDisplay(
			"Level",
			"player:level-up",
			this.PlayerStatsEl,
			"stat-num-template",
			(payload, {valueEl}) => {
				valueEl.textContent = payload.toString()
			}
		).init();

		const stamina = new StatDisplay(
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

		const renown = new StatDisplay(
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

		this.render();
		bus.on("player:statsChanged", () => this.render());

	}

	private render(): void{


		const el = document.getElementById("player-statlist")!;
		const stats = Player.getInstance().getPlayerCharacter().stats.getAll();
		        console.log(stats.attackFlat)
		el.innerHTML = "";
		el.appendChild(this.createSection("Core Stats", this.coreKeys, stats))
		el.appendChild(this.createSection("Extra Stats", this.extraKeys, stats))
	}

	private createSection(title: string, keys: (keyof PlayerStats)[], stats:PlayerStats): HTMLElement{
		const details = document.createElement("details");
		details.classList.add("stat-section");

		details.open = !!this.sectionOpen[title];

		details.addEventListener("toggle", () => {
			this.sectionOpen[title] = details.open;
		})

		const summary = document.createElement("summary");
		summary.textContent = title;
		details.appendChild(summary);

		// One per row
		for (const key of keys){
			const row = document.createElement("div");
			row.classList.add("stat-row");

			const nameSpan = document.createElement("span");
			nameSpan.textContent = key;

			const valueSpan = document.createElement("span");
			valueSpan.textContent = String(Math.round((stats[key] + Number.EPSILON) * 100) / 100);

			row.append(nameSpan, valueSpan);
			details.appendChild(row);
		}
		return details;
	}
}
