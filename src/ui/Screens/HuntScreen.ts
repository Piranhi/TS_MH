import { BaseScreen } from "./BaseScreen";
import Markup from "./hunt.html?raw";
import { bus } from "../../core/EventBus";
import { HuntState } from "@/features/hunt/HuntManager";
import { PlayerCharacter } from "../../models/PlayerCharacter";
import { EnemyCharacter } from "../../models/EnemyCharacter";
import { CharacterDisplay } from "../components/CharacterDisplay";
import { InventoryRegistry } from "@/features/inventory/InventoryRegistry";
import { AreaStats } from "@/shared/stats-types";
import { Player } from "@/core/Player";
import { bindEvent } from "@/shared/utils/busUtils";

export class HuntScreen extends BaseScreen {
	readonly screenName = "hunt";
	private readonly MAX_LOG_LINES = 50;

	// DOM ELEMENTS
	private huntUpdateEl!: HTMLElement;
	private playerCard!: CharacterDisplay;
	private enemyCard!: CharacterDisplay | null;
	private areaSelectEl!: HTMLSelectElement;
	private statTotalKillsEl!: HTMLElement;
	private statKillsThisRunEl!: HTMLElement;
	private statBossUnlockedEl!: HTMLElement;
	private fightBossBtn!: HTMLButtonElement;
	private bossKilledThisRunEl!: HTMLElement;
	private bossKillsEl!: HTMLElement;

	constructor() {
		super();
		this.addMarkuptoPage(Markup);
	}

	init() {
		this.setupElements();
		this.playerCard = new CharacterDisplay(true, this.byId("char-card-player"));
		this.enemyCard = new CharacterDisplay(false, this.byId("char-card-enemy"));
		this.bindEvents();
	}

	show() {
		this.context.hunt.areaManager.refresh();
		this.buildAreaSelect();
	}

	hide() {}

	handleTick(dt: number): void {}

	private setupElements() {
		this.huntUpdateEl = document.getElementById("hunt-update-log") as HTMLElement;
		this.areaSelectEl = this.byId("area-select") as HTMLSelectElement;

		// AREA STATS
		this.statTotalKillsEl = this.byId("area-total-kills");
		this.statKillsThisRunEl = this.byId("area-kills-this-run");
		this.statBossUnlockedEl = this.byId("area-boss-unlocked");
		this.bossKilledThisRunEl = this.byId("area-boss-killed");
		this.bossKillsEl = this.byId("area-boss-kills");
		this.fightBossBtn = this.byId("fight-boss-btn") as HTMLButtonElement;
		this.fightBossBtn.disabled = true;
	}

	private bindEvents() {
		bindEvent(this.eventBindings, "hunt:stateChanged", (state) => this.areaChanged(state));
		bindEvent(this.eventBindings, "stats:areaStatsChanged", (stats) => this.updateAreaStats(stats));
		bindEvent(this.eventBindings, "Game:GameTick", (dt) => this.handleTick(dt));
		bindEvent(this.eventBindings, "combat:started", (combat) => this.combatStarted(combat));
		bindEvent(this.eventBindings, "combat:ended", (result) => this.combatEnded(result));
		bindEvent(this.eventBindings, "hunt:areaUnlocked", () => this.buildAreaSelect());
		bindEvent(this.eventBindings, "inventory:dropped", (drops) => {
			const names = drops.map((drop) => InventoryRegistry.getItemById(drop).name).join(", ");
			this.updateOutput(`Dropped: ${names}`);
		});
		this.bindDomEvent(this.fightBossBtn, "click", this.onFightBoss);
		this.bindDomEvent(this.areaSelectEl, "change", this.onAreaChanged);
	}

	private onFightBoss = (e: Event) => {
		e.preventDefault();
		this.context.hunt.fightBoss();
	};

	private onAreaChanged = (e: Event) => {
		const areaId = (e.target as HTMLSelectElement).value;
		bus.emit("hunt:areaSelected", areaId);
	};

	private buildAreaSelect() {
		// Setup Area select based on all Areas from JSON
		const activeArea = this.context.hunt.getActiveAreaID();

		this.areaSelectEl.innerHTML = "";

		const defaultArea = document.createElement("option");

		// Add default Area
		defaultArea.textContent = "Select an area…";
		defaultArea.value = "";
		defaultArea.disabled = true;
		this.areaSelectEl.options.add(defaultArea);
		this.areaSelectEl.selectedIndex = 0;

		const Areas = this.context.hunt.areaManager.getUnlockedAreas();
		Areas.forEach((area, index) => {
			const areaSelect = document.createElement("option");
			areaSelect.value = area.id;
			areaSelect.textContent = `[T${area.tier}] - ${area.displayName}`;
			this.areaSelectEl.options.add(areaSelect);
			if (area.id === activeArea) this.areaSelectEl.selectedIndex = index + 1; // Set to +1 because we add the default area at the start
		});
	}

	private combatStarted(combat: { enemy: EnemyCharacter; player: PlayerCharacter }) {
		this.initCharacters(combat.enemy);
		this.updateOutput(`You are in combat with <span class="rarity-${combat.enemy.spec.rarity}"> ${combat.enemy.name}</span>`);
	}

	private combatEnded(result: string) {
		this.clearEnemy();
		//this.updateOutput(result);
	}

	private fightBoss(e: Event) {
		e.preventDefault();
		this.context.hunt.fightBoss();
	}

	// Updated from Hunt Manager when area is selected/Stat updated
	private updateAreaStats(stats: AreaStats) {
		this.statKillsThisRunEl.textContent = stats.killsThisRun.toString();
		this.statTotalKillsEl.textContent = stats.killsTotal.toString();
		this.statBossUnlockedEl.textContent = stats.bossUnlockedThisRun ? "Yes" : "No";
		this.bossKilledThisRunEl.textContent = stats.bossKilledThisRun ? "Yes" : "No";
		this.bossKillsEl.textContent = stats.bossKillsTotal.toString();
		this.fightBossBtn.disabled = !stats.bossUnlockedThisRun && !stats.bossKilledThisRun;
	}

	private initCharacters(enemy: EnemyCharacter) {
		this.clearEnemy();
		this.playerCard.setup();
		this.clearEnemy();
		this.enemyCard?.setCharacter(enemy);
		this.enemyCard?.setup();
	}

	private clearEnemy() {
		this.enemyCard?.clearCharacter();
	}

	areaChanged(state: HuntState) {
		switch (state) {
			case HuntState.Idle:
				return;
				break;
			case HuntState.Search:
				return this.enterSearch();
				break;
			case HuntState.Combat:
				return this.enterCombat();
				break;
			case HuntState.Recovery:
				return this.enterRecovery();
				break;
		}
	}

	enterSearch() {}

	enterCombat() {}

	enterRecovery() {
		//this.enemyCard?.clearCharacter();
		//this.playerCard.clearCharacter();
		this.updateOutput("In Recovery");
	}

	private updateOutput(s: string) {
		if (!s) return;

		const li = document.createElement("li");
		li.innerHTML = s;
		this.huntUpdateEl.append(li);

		while (this.huntUpdateEl.children.length > this.MAX_LOG_LINES) {
			this.huntUpdateEl.removeChild(this.huntUpdateEl.firstElementChild!);
		}
	}

	public destroy() {
		super.destroy();
		this.enemyCard?.destroy();
		this.enemyCard = null!;
		this.playerCard.destroy();
		this.playerCard = null!;
	}
}
