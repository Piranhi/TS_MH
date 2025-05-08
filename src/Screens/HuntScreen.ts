import { BaseScreen } from "./BaseScreen";
import Markup from "./hunt.html?raw";
import { bus } from "../EventBus";
import { HuntState } from "@/features/hunt/HuntManager";
import { PlayerCharacter } from "@/features/Characters/PlayerCharacter";
import { EnemyCharacter } from "@/features/Characters/EnemyCharacter";
import { CharacterHolder } from "../features/hunt/ui/CharacterHolder";
import { addHTMLtoPage } from "./ScreensUtils";

export class HuntScreen extends BaseScreen {
    // DOM ELEMENTS
    private huntUpdateEl!: HTMLElement;
    private playerHolderEl!: HTMLElement;
    private enemyHolderEl!: HTMLElement;

    private playerCard!: CharacterHolder;
    private enemyCard!: CharacterHolder;

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
        this.playerCard = new CharacterHolder(document.getElementById("player-holder")!, true);
        this.enemyCard = new CharacterHolder(document.getElementById("enemy-holder",)!, false);
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
