import { BaseScreen } from "./BaseScreen";
import Markup from "./hunt.html?raw";
import { bus } from "../../core/EventBus";
import { HuntState } from "@/features/hunt/HuntManager";
import { PlayerCharacter } from "../../models/PlayerCharacter";
import { EnemyCharacter } from "../../models/EnemyCharacter";
import { CharacterDisplay } from "../components/CharacterDisplay";
import { InventoryRegistry } from "@/features/inventory/InventoryRegistry";
import { bindEvent } from "@/shared/utils/busUtils";
import { AreaDisplay } from "../components/AreaDisplay";

export class HuntScreen extends BaseScreen {
	readonly screenName = "hunt";
	private readonly MAX_LOG_LINES = 50;

	// DOM ELEMENTS
	private huntUpdateEl!: HTMLElement;
	private playerCard!: CharacterDisplay;
	private enemyCard!: CharacterDisplay | null;
	private areaSelectEl!: HTMLSelectElement;
	private areaDisplay!: AreaDisplay;
	private searchingOverlay!: HTMLElement;

	constructor() {
		super();
		this.addMarkuptoPage(Markup);
	}

	init() {
		this.setupElements();
		this.playerCard = new CharacterDisplay(true, this.byId("char-card-player"));
		this.enemyCard = new CharacterDisplay(false, this.byId("char-card-enemy"));
		this.playerCard.receiveCharacter(this.context.character);
		this.playerCard.setup();
		this.areaDisplay = new AreaDisplay(this.byId("area-stats"));

		// Initialize searching overlay as hidden
		this.hideSearchingOverlay();

		this.bindEvents();
	}

	show() {
		this.context.hunt.areaManager.refresh();
		this.buildAreaSelect();
	}

	hide() {}

	handleTick(dt: number): void {
		this.playerCard.render();
		this.enemyCard?.render();
	}

	private setupElements() {
		this.huntUpdateEl = this.byId("hunt-update-log") as HTMLElement;
		this.areaSelectEl = this.byId("area-select") as HTMLSelectElement;
		this.searchingOverlay = this.byId("searching-overlay") as HTMLElement;
	}

	private bindEvents() {
		bindEvent(this.eventBindings, "hunt:stateChanged", (state) => this.areaChanged(state));
		bindEvent(this.eventBindings, "Game:GameTick", (dt) => this.handleTick(dt));
		bindEvent(this.eventBindings, "combat:started", (combat) => this.combatStarted(combat));
		bindEvent(this.eventBindings, "combat:ended", (result) => this.combatEnded(result));
		bindEvent(this.eventBindings, "hunt:areaUnlocked", () => this.buildAreaSelect());
		bindEvent(this.eventBindings, "combat:postCombatReport", (report) => this.combatPostCombatReport(report));

		this.bindDomEvent(this.areaSelectEl, "change", this.onAreaChanged);
	}

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
		this.updateCombatLog(`You are in combat with <span class="rarity-${combat.enemy.spec.rarity}"> ${combat.enemy.name}</span>`);
	}

	private combatEnded(result: string) {
		this.clearEnemy();
	}

	private initCharacters(enemy: EnemyCharacter) {
		this.clearEnemy();
		this.playerCard.receiveCharacter(this.context.character);
		//this.playerCard.setup();
		//this.clearEnemy();
		this.enemyCard?.receiveCharacter(enemy);
		//this.enemyCard?.setup();
	}

	private clearEnemy() {
		this.enemyCard?.clearCharacter();
	}

	areaChanged(state: HuntState) {
		switch (state) {
			case HuntState.Idle:
				this.hideSearchingOverlay();
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
			case HuntState.Boss:
				this.hideSearchingOverlay();
				return;
				break;
		}
	}

	enterSearch() {
		this.showSearchingOverlay();
	}

	enterCombat() {
		this.hideSearchingOverlay();
	}

	enterRecovery() {
		this.hideSearchingOverlay();
		this.updateCombatLog("In Recovery");
	}

	private showSearchingOverlay() {
		this.searchingOverlay.classList.add("active");
	}

	private hideSearchingOverlay() {
		this.searchingOverlay.classList.remove("active");
	}

	private combatPostCombatReport(report: { enemy: EnemyCharacter; area: Area; xp: number; loot: string[]; renown: number }) {
		this.updateCombatLog(
			`You have defeated <span class="rarity-${report.enemy.spec.rarity}"> ${report.enemy.name}</span> and gained ${report.xp} XP and ${report.renown} renown!`
		);
	}

	private updateCombatLog(s: string) {
		if (!s) return;
		const container = document.createElement("div");
		container.className = "log-entry";
		const msg = document.createElement("span");
		msg.innerHTML = s;
		container.appendChild(msg);
		this.huntUpdateEl.append(container);

		/* 		const li = document.createElement("li");
		li.innerHTML = s;
		this.huntUpdateEl.append(li); */

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
