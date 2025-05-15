import { bus } from "@/core/EventBus";
import { Player } from "@/models/player";
import { PlayerStats } from "@/models/Stats";

export class PlayerStatsDisplay {
	private coreKeys: (keyof PlayerStats)[] = ["attack", "defence", "speed", "hp"];
	private extraKeys: (keyof PlayerStats)[] = ["attackFlat", "defenceFlat", "critChance", "critDamage", "lifesteal"];

	private sectionOpen: Record<string, boolean> = {
		"Core Stats": true, // default open
		"Extra Stats": true,
	};

	constructor(private container: HTMLElement) {
		this.render();
		bus.on("player:statsChanged", () => this.render());
	}

	private render(): void {
		const stats = Player.getInstance().getPlayerCharacter().statsEngine.getAll();
		this.container.innerHTML = "";
		this.container.appendChild(this.createSection("Core Stats", this.coreKeys, stats));
		this.container.appendChild(this.createSection("Extra Stats", this.extraKeys, stats));
	}

	private createSection(title: string, keys: (keyof PlayerStats)[], stats: PlayerStats): HTMLElement {
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
			//valueSpan.textContent = String(Math.round((stats[key] + Number.EPSILON) * 100) / 100); (FIX UP)

			row.append(nameSpan, valueSpan);
			details.appendChild(row);
		}
		return details;
	}
}
