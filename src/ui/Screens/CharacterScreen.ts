import { PlayerStatsDisplay } from "../components/PlayerStatsDisplay";
import { BaseScreen } from "./BaseScreen";
import Markup from "./character.html?raw";

export class CharacterScreen extends BaseScreen {
	readonly screenName = "character";
	private playerStatsDiplay!: PlayerStatsDisplay;

	init() {
		this.addMarkuptoPage(Markup);
		//this.element = this.getById("character-container")!;
		//this.playerStatsDiplay = new PlayerStatsDisplay(this.byId("player-statlist")!);
	}
	show() {}
	hide() {}
	bindEvents() {}
}
