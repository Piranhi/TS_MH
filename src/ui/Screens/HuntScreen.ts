import { BaseScreen } from "./BaseScreen";
import Markup from "./hunt.html?raw";
import { bus } from "../../core/EventBus";
import { HuntState } from "@/features/hunt/HuntManager";
import { PlayerCharacter } from "../../models/PlayerCharacter";
import { EnemyCharacter } from "../../models/EnemyCharacter";
import { CharacterDisplay } from "../components/CharacterDisplay";
import { addHTMLtoPage } from "../utils/ScreensUtils";
import { Area } from "@/models/Area";
import { InventoryRegistry } from "@/features/inventory/InventoryRegistry";

export class HuntScreen extends BaseScreen {
    readonly screenName = "hunt";
    private readonly MAX_LOG_LINES = 50;

    // DOM ELEMENTS
    private huntUpdateEl!: HTMLElement;
    private playerCard!: CharacterDisplay;
    private enemyCard!: CharacterDisplay;
    private areaSelectEl!: HTMLSelectElement;

    init() {
        addHTMLtoPage(Markup, this);
        this.setupElements();
        this.bindEvents();
    }

    show() {
        this.playerCard.render();
        this.enemyCard.render();
    }

    hide() {}

    handleTick(dt: number): void {
        this.playerCard.render();
        this.enemyCard.render();
    }

    private setupElements() {
        this.huntUpdateEl = document.getElementById("hunt-update-log") as HTMLElement;
        this.buildAreaSelect();
        // Setup Player Cards
        this.playerCard = new CharacterDisplay("active", true);
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

    private bindEvents() {
        bus.on("hunt:stateChanged", (state) => this.areaChanged(state));
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
