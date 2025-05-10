import { BaseScreen } from "./BaseScreen";
import Markup from "./hunt.html?raw";
import { bus } from "../../core/EventBus";
import { HuntState } from "@/features/hunt/HuntManager";
import { PlayerCharacter } from "../../models/PlayerCharacter";
import { EnemyCharacter } from "../../models/EnemyCharacter";
import { CharacterDisplay } from "../components/CharacterDisplay";
import { addHTMLtoPage } from "../utils/ScreensUtils";

export class HuntScreen extends BaseScreen {
    // DOM ELEMENTS
    private huntUpdateEl!: HTMLElement;
    private playerCard!: CharacterDisplay;
    private enemyCard!: CharacterDisplay;
    readonly screenName = "hunt";
    private readonly MAX_LOG_LINES = 50;

    constructor() {
        super();
    }

    init() {
        addHTMLtoPage(Markup, this);
        this.setupElements();

        bus.on("hunt:stateChanged", (state) => this.areaChanged(state));

        bus.on("combat:started", (combat) => {
            this.initCharacters(combat.player, combat.enemy);
            this.updateOutput(`You are in combat with <span class="rarity-${combat.enemy.spec.rarity}"> ${combat.enemy.getName()}</span>`);
        });
        bus.on("combat:ended", (result) => {
            this.updateOutput(result);
        });

        bus.on("Game:UITick", (dt) => this.handleTick(dt));

        document.getElementById("area-select")!.addEventListener("change", (e) => {
            const areaId = (e.target as HTMLSelectElement).value;
            bus.emit("hunt:areaSelected", areaId);
        });
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
        this.huntUpdateEl = document.getElementById("hunt-update")!;
        this.playerCard = new CharacterDisplay(true);
        this.enemyCard = new CharacterDisplay(false);
    }

    private initCharacters(player: PlayerCharacter, enemy: EnemyCharacter) {
        this.playerCard.setup(player);
        this.enemyCard.setup(enemy);
    }

    areaChanged(state: HuntState) {
        switch (state) {
            case HuntState.Idle:
                break;
            case HuntState.Search:
                this.enterSearch();
                break;
            case HuntState.Combat:
                this.enterCombat();
                break;
            case HuntState.Recovery:
                this.enterRecovery();
                break;
        }
    }

    enterSearch() {}

    enterCombat() {}

    enterRecovery() {
        this.updateOutput("In Recovery");
    }

    private updateOutput(s: string) {
        const li = document.createElement("li");
        li.innerHTML = s;
        this.huntUpdateEl.append(li);

        while (this.huntUpdateEl.children.length > this.MAX_LOG_LINES) {
            this.huntUpdateEl.removeChild(this.huntUpdateEl.firstElementChild!);
        }
    }
}
