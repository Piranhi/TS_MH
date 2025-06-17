import { MineResourceDisplay } from "../components/MineResourceDisplay";
import { BaseScreen } from "./BaseScreen";
import Markup from "./mine.html?raw";
import { bus } from "@/core/EventBus";
import { UpgradeSelectionContainer } from "../components/UpgradeSelectionContainer";

export class MineScreen extends BaseScreen {
	readonly screenName = "mine";
	private tempMineTimer = 0;
	//private mineDisplaysMap = new Map<ConstructionResourceType, MineResourceDisplay>();
	private upgradeContainer!: UpgradeSelectionContainer;

	init() {
		this.addMarkuptoPage(Markup);
		this.build();
		bus.on("Game:UITick", (delta) => this.handleTick(delta));
	}
	show() {}
	hide() {}

	private handleTick(dt: number) {
		/* 		for (const mineDisplay of Array.from(this.mineDisplaysMap.values())) {
			if (mineDisplay) mineDisplay.tick(dt);
		} */
		this.tempMineTimer += dt;
		if (this.tempMineTimer >= 2) {
			this.tempMineTimer -= 2;
			this.context.resources.addResource("raw_ore", 1);
		}
	}

	private build() {
		// Clear and populate the mine resource list with Classes
		const resourceListEl = this.byId("mineResourceList");
		resourceListEl.innerHTML = "";

		const mineResource = new MineResourceDisplay(resource, resourceListEl);
		//this.mineDisplaysMap.set(resource, mineResource);

		const upgGrid = this.byId("mineUpgradesGrid");
		this.upgradeContainer = new UpgradeSelectionContainer({
			container: upgGrid,
			upgrades: [],
		});
	}
}
