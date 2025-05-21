import { CONSTRUCTION_RESOURCE_TYPES, ConstructionResourceType } from "@/shared/types";
import { MineResourceDisplay } from "../components/MineResourceDisplay";
import { BaseScreen } from "./BaseScreen";
import Markup from "./mine.html?raw";
import { bus } from "@/core/EventBus";

export class MineScreen extends BaseScreen {
	readonly screenName = "mine";
	private mineDisplaysMap = new Map<ConstructionResourceType, MineResourceDisplay>();

	init() {
		this.addMarkuptoPage(Markup);
		this.build();
		bus.on("Game:UITick", (delta) => this.handleTick(delta));
	}
	show() {}
	hide() {}

	private handleTick(dt: number) {
		for (const display of Array.from(this.mineDisplaysMap.values())) {
			if (display) display.tick(dt);
		}
	}

	private build() {
		// Clear and populate the mine resource list with Classes
		const resourceListEl = this.byId("mineResourceList");
		resourceListEl.innerHTML = "";

		CONSTRUCTION_RESOURCE_TYPES.forEach((resource) => {
			const mineResource = new MineResourceDisplay(resource, resourceListEl);
			this.mineDisplaysMap.set(resource, mineResource);
		});
	}
}
