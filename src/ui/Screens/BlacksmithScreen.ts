import { bus } from "@/core/EventBus";
import { BaseScreen } from "./BaseScreen";
import Markup from "./blacksmith.html?raw";
import { bindEvent } from "@/shared/utils/busUtils";
import { Resource } from "@/features/inventory/Resource";

export class BlacksmithScreen extends BaseScreen {
	readonly screenName = "blacksmith";
	private tempResourceTimer = 0;

	init() {
		this.addMarkuptoPage(Markup);
		this.build();
		this.bindEvents();
	}
	show() {}
	hide() {}

	private build() {
		this.updateResourcesDisplay();
	}

	private bindEvents() {
		bus.on("Game:UITick", (delta) => this.handleTick(delta));

		bindEvent(this.eventBindings, "resources:changed", () => this.updateResourcesDisplay());
	}

	private updateResourcesDisplay() {
		const temp = this.$("#temp") as HTMLElement;
		temp.innerHTML = "";
		const resources = this.context.resources.getAllResources();

		for (let [id, resourceData] of resources) {
			const div = document.createElement("div");
			const spec = Resource.getSpec(id); // Returns ResourceSpec, not Resource
			if (spec) {
				div.innerHTML = `${spec.name} - ${resourceData.quantity}`;
				temp.appendChild(div);
			}
		}
	}

	private handleTick(dt: number) {
		/* 		for (const mineDisplay of Array.from(this.mineDisplaysMap.values())) {
			if (mineDisplay) mineDisplay.tick(dt);
		} */
		this.tempResourceTimer += dt;
		if (this.tempResourceTimer >= 2) {
			this.tempResourceTimer -= 2;
			this.context.resources.addResource("raw_ore", 1);
		}
	}
}
