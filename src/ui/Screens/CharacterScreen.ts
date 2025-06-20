import { PlayerStatsDisplay } from "../components/PlayerStatsDisplay";
import { BaseScreen } from "./BaseScreen";
import Markup from "./character.html?raw";
import { bus } from "@/core/EventBus";

export class CharacterScreen extends BaseScreen {
        readonly screenName = "character";
        private playerStatsDiplay!: PlayerStatsDisplay;
        private classTreeEl!: HTMLElement;

        init() {
                this.addMarkuptoPage(Markup);
                //this.element = this.getById("character-container")!;
                //this.playerStatsDiplay = new PlayerStatsDisplay(this.byId("player-statlist")!);
                this.classTreeEl = this.byId("class-tree")!;
                this.updatePoints();
                bus.on("classes:pointsChanged", () => this.updatePoints());
        }
        show() {}
        hide() {}
        bindEvents() {}

        private updatePoints() {
                const pts = this.context.classes.getAvailablePoints();
                this.classTreeEl.textContent = `Class Points: ${pts}`;
        }
}
