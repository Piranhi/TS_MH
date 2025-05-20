import { constructionResourceType } from "@/shared/types";
import { MineResourceDisplay } from "../components/MineResourceDisplay";
import { BaseScreen } from "./BaseScreen";
import Markup from "./mine.html?raw";

export class MineScreen extends BaseScreen {
	readonly screenName = "mine";
	private mineResources = new Map<constructionResourceType, MineResourceDisplay>();

	init() {
		this.addMarkuptoPage(Markup);
		this.createMineResources();
	}
	show() {}
	hide() {}

	private createMineResources() {
		const resourceList = this.byId("mineResourceList");
		const mineResource = new MineResourceDisplay("stone", resourceList);
		this.mineResources.set("stone", mineResource);
	}
}
