import { bus } from "@/core/EventBus";
import { Tooltip } from "./Tooltip";
import { Building } from "@/features/settlement/Building";

export class BuildingDisplay {
	private rootEl!: HTMLElement;
	constructor(private BuildingGridEl: HTMLElement, private template: HTMLTemplateElement, private building?: Building) {
		if (building) {
			const frag = this.template.content.cloneNode(true) as DocumentFragment;
			const root = frag.firstElementChild as HTMLElement;
			if (!root) return;
			const title = root.querySelector(".building-title") as HTMLElement;
			title.textContent = building.displayName;
			const level = root.querySelector(".building-level") as HTMLElement;
			level.textContent = building.level.toString();
			const upgradeBtn = root.querySelector(".upgrade-btn") as HTMLButtonElement;
			upgradeBtn?.addEventListener("click", () => building.upgradeBuilding());
			this.rootEl = root;

			root.classList.add("building-card-built");
		} else {
			const frag = this.template.content.cloneNode(true) as DocumentFragment;
			const root = frag.firstElementChild as HTMLElement;
			if (!root) return;
			this.rootEl = root;
		}

		this.BuildingGridEl.appendChild(this.rootEl);

		this.rootEl.addEventListener("mouseenter", () => this.onHover());
		this.rootEl.addEventListener("mouseleave", () => Tooltip.instance.hide());
	}
	private addBuilding() {}

	private onHover() {
		if (!this.building) return;
		Tooltip.instance.show(this.rootEl, {
			icon: this.building.iconUrl,
			name: this.building.displayName,
			type: "Building",
			description: this.building.description,
		});
	}
}
