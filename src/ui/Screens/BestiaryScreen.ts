import { BaseScreen } from "./BaseScreen";
import Markup from "./bestiary.html?raw";
import { Monster } from "@/models/Monster";
import { StatsManager } from "@/models/StatsManager";
import { BalanceCalculators } from "@/balance/GameBalance";
import { Tooltip } from "@/ui/components/Tooltip";
import { Area } from "@/models/Area";
import { ScreenName } from "@/shared/ui-types";

export class BestiaryScreen extends BaseScreen {
	readonly screenName: ScreenName = "bestiary";

	private listEl!: HTMLElement;
	private detailEl!: HTMLElement;

	init(): void {
		const root = this.addMarkuptoPage(Markup);
		this.listEl = root.querySelector("#bestiaryList") as HTMLElement;
		this.detailEl = root.querySelector("#bestiaryDetail") as HTMLElement;

		this.buildList();
	}

	show(): void {
		// Refresh icons in case new enemies were killed this run
		this.refreshList();
	}

	hide(): void {
		Tooltip.instance.hide();
	}

	private buildList() {
		this.listEl.innerHTML = "";
		const specs = Monster.getAllSpecs();
		for (const spec of specs) {
			const iconDiv = document.createElement("div");
			iconDiv.classList.add("enemy-icon");
			iconDiv.dataset.id = spec.id;

			this.renderIconContents(iconDiv, spec.id);

			// Tooltip
			iconDiv.addEventListener("mouseenter", () => {
				Tooltip.instance.show(iconDiv, { name: spec.displayName, icon: spec.imgUrl });
			});
			iconDiv.addEventListener("mouseleave", () => Tooltip.instance.hide());

			// Click handler
			iconDiv.addEventListener("click", () => this.showDetails(spec.id));

			this.listEl.appendChild(iconDiv);
		}
	}

	private refreshList() {
		// Update each icon to swap ? for image when discovered
		for (const iconDiv of Array.from(this.listEl.children) as HTMLElement[]) {
			const id = iconDiv.dataset.id!;
			this.renderIconContents(iconDiv, id);
		}
	}

	private renderIconContents(container: HTMLElement, enemyId: string) {
		container.innerHTML = "";
		const kills = StatsManager.instance.getEnemyStats(enemyId).killsTotal;
		if (kills > 0) {
			const spec = Monster.getSpec(enemyId)!;
			const img = document.createElement("img");
			img.src = spec.imgUrl;
			img.alt = spec.displayName;
			container.appendChild(img);
		} else {
			container.textContent = "?";
		}
	}

	private showDetails(enemyId: string) {
		const spec = Monster.getSpec(enemyId);
		if (!spec) return;

		const enemyStats = StatsManager.instance.getEnemyStats(enemyId);
		const kills = enemyStats.killsTotal;
		const isBoss = spec.archetype === "boss";
		const dmgBonus = BalanceCalculators.getEnemyKillDamageBonus(kills, isBoss);
		const xpBonus = BalanceCalculators.getEnemyKillXpBonus(kills);

		// Areas where this enemy appears
		const areas = (Area as any).specById ? (Array.from((Area as any).specById.values()) as any[]) : [];
		const locationNames: string[] = [];
		for (const areaSpec of areas) {
			if (areaSpec.spawns?.some((s: any) => s.monsterId === enemyId) || areaSpec.boss?.monsterId === enemyId) {
				locationNames.push(areaSpec.displayName);
			}
		}

		this.detailEl.innerHTML = "";

		const header = document.createElement("h2");
		header.textContent = spec.displayName;
		this.detailEl.appendChild(header);

		// Avatar
		const avatarImg = document.createElement("img");
		avatarImg.src = spec.imgUrl;
		avatarImg.alt = spec.displayName;
		avatarImg.classList.add("enemy-avatar");
		this.detailEl.appendChild(avatarImg);

		// Info list
		const infoList = document.createElement("ul");
		infoList.classList.add("info-list");

		infoList.appendChild(this.makeLi(`Archetype: ${spec.archetype}`));
		infoList.appendChild(this.makeLi(`Rarity: ${spec.rarity}`));
		if (locationNames.length > 0) infoList.appendChild(this.makeLi(`Areas: ${locationNames.join(", ")}`));
		infoList.appendChild(this.makeLi(`Abilities: ${spec.abilities.join(", ")}`));
		if (spec.affinities && spec.affinities.length > 0) {
			const affinities = spec.affinities.map((a) => `${a.type} ${a.element}`).join(", ");
			infoList.appendChild(this.makeLi(`Affinities: ${affinities}`));
		}
		infoList.appendChild(this.makeLi(`Total Kills: ${kills}`));
		infoList.appendChild(this.makeLi(`Damage Bonus: ${dmgBonus.toFixed(2)}%`));
		if (xpBonus > 0) infoList.appendChild(this.makeLi(`XP Bonus: ${xpBonus}%`));

		this.detailEl.appendChild(infoList);
	}

	private makeLi(text: string): HTMLLIElement {
		const li = document.createElement("li");
		li.textContent = text;
		return li;
	}

	destroy(): void {
		Tooltip.instance.hide();
		this.listEl.innerHTML = "";
		super.destroy();
	}
}