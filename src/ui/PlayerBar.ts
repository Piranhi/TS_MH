import { Bounded } from "../domain/value-objects/Bounded";
import { bus, EventKey } from "../EventBus";
import { UIStatBounded } from "./UIStatBounded";
import { UIStatNumber } from "./UIStatNumber";

export class Playerbar {
	constructor(private container: HTMLElement) {}
	private PlayerStatsEl: HTMLUListElement = document.querySelector(".player-stats")!;

	public build() {
		const level = new UIStatNumber("Level", "player:level-up", this.PlayerStatsEl).init();
		const stamina = new UIStatBounded("Stamina", "player:stamina-changed", this.PlayerStatsEl).init();
		const renown = new UIStatBounded("Renown", "Renown:Changed", this.PlayerStatsEl).init();
	}

}
