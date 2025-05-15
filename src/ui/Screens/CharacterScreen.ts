import { PlayerStatsDisplay } from "../components/PlayerStatsDisplay";
import { addHTMLtoPage } from "../utils/ScreensUtils";
import { BaseScreen } from "./BaseScreen";
import Markup from "./character.html?raw";

export class CharacterScreen extends BaseScreen {
	readonly screenName = "character";
	private playerStatsDiplay: PlayerStatsDisplay;
	private rootEl: HTMLElement;

	init() {
		addHTMLtoPage(Markup, this);
		this.rootEl = document.getElementById("character-container")!;
		this.playerStatsDiplay = new PlayerStatsDisplay(document.getElementById("player-statlist")!);
	}
	show() {}
	hide() {}
}
