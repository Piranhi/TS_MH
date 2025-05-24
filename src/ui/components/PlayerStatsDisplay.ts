import { bus } from "@/core/EventBus";
import { Player } from "@/core/Player";
import { Stats } from "@/models/Stats";
import { BigNumber } from "@/models/utils/BigNumber";
import { UIBase } from "./UIBase";
import { bindEvent } from "@/shared/utils/busUtils";

export class PlayerStatsDisplay extends UIBase {
	private coreKeys: (keyof Stats)[] = ["attack", "defence", "speed", "hp"];
	private extraKeys: (keyof Stats)[] = ["attackFlat", "defenceFlat", "critChance", "critDamage", "lifesteal"];

	private sectionOpen: Record<string, boolean> = {
		"Core Stats": true, // default open
		"Extra Stats": true,
	};

	constructor(private container: HTMLElement) {
		super();
		this.render();

		//bindEvent(this.eventBindings, "player:statsChanged", () => this.render());
	}

	private render(): void {
		const stats = this.context.character.statsEngine.getAll();
		this.container.innerHTML = "";
		this.container.appendChild(this.createSection("Core Stats", this.coreKeys, stats));
		this.container.appendChild(this.createSection("Extra Stats", this.extraKeys, stats));
	}

	private createSection(title: string, keys: (keyof Stats)[], stats: Stats): HTMLElement {
		const details = document.createElement("details");
		details.classList.add("stat-section");

		details.open = !!this.sectionOpen[title];

		details.addEventListener("toggle", () => {
			this.sectionOpen[title] = details.open;
		});

		const summary = document.createElement("summary");
		summary.textContent = title;
		details.appendChild(summary);

		// One per row
		for (const key of keys) {
			const row = document.createElement("div");
			row.classList.add("stat-row");

			const nameSpan = document.createElement("span");
			nameSpan.textContent = key;

			const valueSpan = document.createElement("span");
			const val = stats[key];
			let valueStr: string;
			if (val instanceof BigNumber) {
				// To display as a rounded number
				valueStr = val.toNumber().toFixed(2); // 2 decimals, or whatever you want
				// Or if you want prettified scientific display:
				// valueStr = val.toString();
			} else {
				valueStr = String(val); // fallback for non-BigNumber
			}
			valueSpan.textContent = valueStr; //String(Math.round((stats[key] + Number.EPSILON) * 100) / 100); // (FIX UP)

			row.append(nameSpan, valueSpan);
			details.appendChild(row);
		}
		return details;
	}
}
