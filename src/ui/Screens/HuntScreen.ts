import { BaseScreen } from "./BaseScreen";
import Markup from "./hunt.html?raw";
import { bus } from "../../core/EventBus";
import { HuntState } from "@/features/hunt/HuntManager";
import { PlayerCharacter } from "../../models/PlayerCharacter";
import { EnemyCharacter } from "../../models/EnemyCharacter";
import { CharacterDisplay } from "../components/CharacterDisplay";
import { Area } from "@/models/Area";
import { InventoryRegistry } from "@/features/inventory/InventoryRegistry";
import { AreaStats } from "@/shared/stats-types";
import { Player } from "@/models/player";

export class HuntScreen extends BaseScreen {
	readonly screenName = "hunt";
	private readonly MAX_LOG_LINES = 50;

	// DOM ELEMENTS
	private huntUpdateEl!: HTMLElement;
	private playerCard!: CharacterDisplay;
	private enemyCard!: CharacterDisplay;
	private areaSelectEl!: HTMLSelectElement;
	private statTotalKillsEl!: HTMLElement;
	private statKillsThisRunEl!: HTMLElement;
	private statBossUnlockedEl!: HTMLElement;
	private fightBossBtn!: HTMLButtonElement;
	private bossKilledThisRunEl!: HTMLElement;
	private bossKillsEl!: HTMLElement;

	init() {
		this.addMarkuptoPage(Markup);
		this.setupElements();
		this.bindEvents();
	}

	show() {}

	hide() {}

	handleTick(dt: number): void {
		this.playerCard.render();
		this.enemyCard.render();
	}

	private setupElements() {
		this.huntUpdateEl = document.getElementById("hunt-update-log") as HTMLElement;

		// AREA STATS
		this.statTotalKillsEl = document.getElementById("area-total-kills")!;
		this.statKillsThisRunEl = document.getElementById("area-kills-this-run")!;
		this.statBossUnlockedEl = document.getElementById("area-boss-unlocked")!;
		this.bossKilledThisRunEl = document.getElementById("area-boss-killed")!;
		this.bossKillsEl = document.getElementById("area-boss-kills")!;
		this.fightBossBtn = document.getElementById("fight-boss-btn") as HTMLButtonElement;
		this.fightBossBtn.disabled = true;
		this.fightBossBtn.addEventListener("click", (e) => this.fightBoss(e));

		this.buildAreaSelect();
		// Setup Player Cards
		this.playerCard = new CharacterDisplay("active", true);
		this.playerCard.setup(Player.getInstance().getPlayerCharacter());
		this.enemyCard = new CharacterDisplay("inactive", false);
	}

	private buildAreaSelect() {
		// Setup Area select based on all Areas from JSON
		this.areaSelectEl = document.getElementById("area-select") as HTMLSelectElement;
		this.areaSelectEl.innerHTML = "";

		const defaultArea = document.createElement("option");
		defaultArea.textContent = "Select an area…";
		defaultArea.value = "";
		defaultArea.disabled = true;
		this.areaSelectEl.options.add(defaultArea);
		this.areaSelectEl.selectedIndex = 0;

		const Areas = Area.getAllSpecs();
		Areas.forEach((area) => {
			const areaSelect = document.createElement("option");
			areaSelect.value = area.id;
			areaSelect.textContent = `[T${area.tier}] - ${area.displayName}`;
			this.areaSelectEl.options.add(areaSelect);
		});
		this.areaSelectEl.addEventListener("change", (e) => {
			const areaId = (e.target as HTMLSelectElement).value;
			bus.emit("hunt:areaSelected", areaId);
		});
	}

	private fightBoss(e: Event) {
		e.preventDefault();
		Player.getInstance().huntManager.fightBoss();
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

	private bindEvents() {
		bus.on("hunt:stateChanged", (state) => this.areaChanged(state));
		bus.on("stats:areaStatsChanged", (stats) => this.updateAreaStats(stats));
		bus.on("Game:UITick", (dt) => this.handleTick(dt));
		bus.on("combat:started", (combat) => {
			this.initCharacters(combat.player, combat.enemy);
			this.updateOutput(`You are in combat with <span class="rarity-${combat.enemy.spec.rarity}"> ${combat.enemy.name}</span>`);
		});
		bus.on("combat:ended", (result) => {
			this.updateOutput(result);
		});
		bus.on("inventory:dropped", (drops) => {
			const names = drops.map((drop) => InventoryRegistry.getItemById(drop).name).join(", ");
			this.updateOutput(`Dropped: ${names}`);
		});
	}

	private initCharacters(player: PlayerCharacter, enemy: EnemyCharacter) {
		this.playerCard.setup(player);
		this.enemyCard.setup(enemy);
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

	enterSearch() {
		this.enemyCard.clearCharacter();
	}

	enterCombat() {}

	enterRecovery() {
		this.enemyCard.clearCharacter();
		this.playerCard.clearCharacter();
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
}
