import { PlayerStatsDisplay } from "../components/PlayerStatsDisplay";
import { BaseScreen } from "./BaseScreen";
import Markup from "./character.html?raw";

export class CharacterScreen extends BaseScreen {
	readonly screenName = "character";
	private playerStatsDiplay!: PlayerStatsDisplay;

	init() {
		this.addMarkuptoPage(Markup);
		this.element = document.getElementById("character-container")!;
		this.playerStatsDiplay = new PlayerStatsDisplay(document.getElementById("player-statlist")!);
		this.bindEvents();
	}
	show() {}
	hide() {}
	bindEvents() {}
}
