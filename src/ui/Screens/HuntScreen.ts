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
import { Area } from "@/models/Area";
import { InventoryManager } from "@/features/inventory/InventoryManager";

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

	protected onShow() {
		this.context.hunt.areaManager.refresh();
		this.buildAreaSelect();
	}

	protected onHide() {}

	protected handleTick(dt: number): void {
		if (!this.isActive) return;
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

	/* 	private combatPostCombatReport(report: { enemy: EnemyCharacter; area: Area; xp: number; loot: string[]; renown: number }) {
		this.updateCombatLog(
			`<span class ="log-player">You</span> have defeated <span class="log-enemy rarity-${report.enemy.spec.rarity}"> ${report.enemy.name}</span> and gained <span class="log-xp">${report.xp} XP</span> and <span class="log-renown">${report.renown} renown</span>!`
		);
	} */

	private combatPostCombatReport(report: {
		enemy: EnemyCharacter;
		area: Area;
		xp: number;
		loot: any[];
		renown: number;
		gold?: number;
		recruit?: any;
		rewards?: any[];
	}) {
		// Build individual reward strings only when present
		const rewardParts: string[] = [];

		if (report.xp) {
			rewardParts.push(`<span class="log-xp">${report.xp} XP</span>`);
		}
		if (report.gold) {
			rewardParts.push(`<span class="log-gold">${report.gold} gold</span>`);
		}
		if (report.renown) {
			rewardParts.push(`<span class="log-renown">${report.renown} renown</span>`);
		}
		if (report.recruit) {
			rewardParts.push(`<span class="log-recruits">${report.recruit} recruit</span>`);
		}
		if (report.loot && report.loot.length) {
			const lootList = report.loot.map((l) => `<span class="log-loot">${InventoryRegistry.getItemById(l).name}</span>`).join(", ");
			rewardParts.push(`looted ${lootList}`);
			//rewardParts.push(`<span class="log-equipment">${InventoryRegistry.getItemById(report.loot[0]).name}</span>`);
		}

		// Nice grammar: “10 XP and 3 gold” (Oxford comma handled automatically)
		const formatter = new Intl.ListFormat("en", { style: "long", type: "conjunction" });
		const rewardsStr = rewardParts.length ? ` and gained ${formatter.format(rewardParts)}` : "";

		this.updateCombatLog(
			`<span class="log-player">You</span> have defeated ` +
				`<span class="log-enemy rarity-${report.enemy.spec.rarity}">${report.enemy.name}</span>` +
				`${rewardsStr}!`
		);
	}

	private updateCombatLog(s: string, entryClass?: string) {
		if (!s) return;
		const container = document.createElement("div");
		container.className = `log-entry ${entryClass || ""}`.trim();
		const msg = document.createElement("span");
		msg.innerHTML = s;
		container.appendChild(msg);
		this.huntUpdateEl.append(container);

		while (this.huntUpdateEl.children.length > this.MAX_LOG_LINES) {
			this.huntUpdateEl.removeChild(this.huntUpdateEl.firstElementChild!);
		}
	}

	// Utility methods for easier combat log formatting
	public logDamage(attacker: string, target: string, damage: number, isCrit = false): void {
		const critClass = isCrit ? "log-crit" : "";
		const attackerClass = attacker === "You" ? "log-player" : "log-enemy";
		const targetClass = target === "You" ? "log-player" : "log-enemy";
		this.updateCombatLog(
			`<span class="${attackerClass}">${attacker}</span> deals <span class="log-damage ${critClass}">${damage}</span> damage to <span class="${targetClass}">${target}</span>`
		);
	}

	public logHeal(healer: string, target: string, amount: number): void {
		const healerClass = healer === "You" ? "log-player" : "log-enemy";
		const targetClass = target === "You" ? "log-player" : "log-enemy";
		this.updateCombatLog(
			`<span class="${healerClass}">${healer}</span> heals <span class="${targetClass}">${target}</span> for <span class="log-heal">${amount}</span> HP`
		);
	}

	public logMiss(attacker: string, target: string): void {
		const attackerClass = attacker === "You" ? "log-player" : "log-enemy";
		const targetClass = target === "You" ? "log-player" : "log-enemy";
		this.updateCombatLog(
			`<span class="${attackerClass}">${attacker}</span> <span class="log-miss">misses</span> <span class="${targetClass}">${target}</span>`
		);
	}

	public logStatus(target: string, statusName: string, isPositive = true): void {
		const targetClass = target === "You" ? "log-player" : "log-enemy";
		const statusClass = isPositive ? "log-buff" : "log-debuff";
		this.updateCombatLog(
			`<span class="${targetClass}">${target}</span> is affected by <span class="${statusClass}">${statusName}</span>`
		);
	}

	public logImportant(message: string): void {
		this.updateCombatLog(`<span class="log-important">${message}</span>`);
	}

	public destroy() {
		super.destroy();
		this.enemyCard?.destroy();
		this.enemyCard = null!;
		this.playerCard.destroy();
		this.playerCard = null!;
	}
}
