import { PlayerStatsDisplay } from "../components/PlayerStatsDisplay";
import { BaseScreen } from "./BaseScreen";
import Markup from "./character.html?raw";

export class CharacterScreen extends BaseScreen {
	readonly screenName = "character";
	private playerStatsDiplay: PlayerStatsDisplay;
	private rootEl: HTMLElement;

	init() {
		this.addMarkuptoPage(Markup);
		this.rootEl = document.getElementById("character-container")!;
		this.playerStatsDiplay = new PlayerStatsDisplay(document.getElementById("player-statlist")!);
	}
	show() {}
	hide() {}
}
