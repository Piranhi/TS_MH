import { BaseScreen } from "./BaseScreen";
import Markup from "./bestiary.html?raw";
import { Monster } from "@/models/Monster";
import { StatsManager } from "@/models/StatsManager";
import { BalanceCalculators } from "@/balance/GameBalance";
import { Tooltip } from "@/ui/components/Tooltip";
import { TableDisplay } from "@/ui/components/TableDisplay";
import { Area } from "@/models/Area";
import { ScreenName } from "@/shared/ui-types";

export class BestiaryScreen extends BaseScreen {
	readonly screenName: ScreenName = "bestiary";

	private listEl!: HTMLElement;
	private detailEl!: HTMLElement;
	private countEl!: HTMLElement;

	init(): void {
		const root = this.addMarkuptoPage(Markup);
		this.listEl = root.querySelector("#bestiaryList") as HTMLElement;
		this.detailEl = root.querySelector("#bestiaryDetail") as HTMLElement;
		this.countEl = root.querySelector("#bestiaryCount") as HTMLElement;

		this.setupTickingFeature("feature.bestiary", () => {
			this.buildList();
		});
	}

	show(): void {
		if (!this.isFeatureActive()) return;
		// Refresh icons and discovered counter in case new enemies were killed this run
		this.refreshList();
	}

	hide(): void {
		if (!this.isFeatureActive()) return;
		Tooltip.instance.hide();
	}

	private buildList() {
		this.listEl.innerHTML = "";
		const specs = Monster.getAllSpecs();
		for (const spec of specs) {
			const iconDiv = document.createElement("div");
			iconDiv.classList.add("enemy-icon");
			iconDiv.dataset.id = spec.id;

			const kills = StatsManager.instance.getEnemyStats(spec.id).killsTotal;

			// Render icon (image or ?)
			this.renderIconContents(iconDiv, spec.id);

			if (kills > 0) {
				// Tooltip for discovered monsters
				iconDiv.addEventListener("mouseenter", () => {
					Tooltip.instance.show(iconDiv, { name: spec.displayName, icon: spec.imgUrl });
				});
				iconDiv.addEventListener("mouseleave", () => Tooltip.instance.hide());

				// Click handler for discovered monsters
				iconDiv.addEventListener("click", () => this.showDetails(spec.id));
			} else {
				iconDiv.classList.add("undiscovered");
			}

			this.listEl.appendChild(iconDiv);
		}

		// Update count after building list
		this.updateCount();
	}

	private refreshList() {
		// Simply rebuild the list to ensure icons, tooltips and handlers are up-to-date
		this.buildList();
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

		// Flex container for avatar + table
		const contentRow = document.createElement("div");
		contentRow.classList.add("detail-content");
		this.detailEl.appendChild(contentRow);

		// Avatar
		const avatarImg = document.createElement("img");
		avatarImg.src = spec.imgUrl;
		avatarImg.alt = spec.displayName;
		avatarImg.classList.add("enemy-avatar");
		contentRow.appendChild(avatarImg);

		// Prepare rows for table display
		const rows: (string | number)[][] = [];
		rows.push(["Archetype", spec.archetype]);
		rows.push(["Rarity", spec.rarity]);
		if (locationNames.length > 0) rows.push(["Areas", locationNames.join(", ")]);
		rows.push(["Abilities", spec.abilities.join(", ")]);
		if (spec.affinities && spec.affinities.length > 0) {
			const affinities = spec.affinities.map((a) => `${a.type} ${a.element}`).join(", ");
			rows.push(["Affinities", affinities]);
		}
		rows.push(["Total Kills", kills]);
		rows.push(["Damage Bonus", `${dmgBonus.toFixed(2)}%`]);
		if (xpBonus > 0) rows.push(["XP Bonus", `${xpBonus}%`]);

		// Table Display
		const table = new TableDisplay({
			container: contentRow,
			columns: 2,
			boldFirstColumn: true,
		});
		table.setRows(rows);
	}

	/** Update the found/total counter */
	private updateCount() {
		const specs = Monster.getAllSpecs();
		let discovered = 0;
		for (const spec of specs) {
			if (StatsManager.instance.getEnemyStats(spec.id).killsTotal > 0) discovered++;
		}
		if (this.countEl) {
			this.countEl.textContent = `Found: ${discovered}/${specs.length}`;
		}
	}

	destroy(): void {
		Tooltip.instance.hide();
		this.listEl.innerHTML = "";
		super.destroy();
	}
}
