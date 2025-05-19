import { Tooltip } from "./Tooltip";
import { Building } from "@/features/settlement/Building";
import { UIBase } from "./UIBase";

export class BuildingDisplay extends UIBase {
	private onUpgradeClick: ((e: Event) => void) | null = null;
	private upgradeBtn: HTMLButtonElement | null = null;
	//private rootEl!: HTMLElement;
	constructor(private BuildingGridEl: HTMLElement, private template: HTMLTemplateElement, private building?: Building) {
		super();
		if (building) {
			const frag = this.template.content.cloneNode(true) as DocumentFragment;
			const root = frag.firstElementChild as HTMLElement;
			if (!root) return;
			const title = root.querySelector(".building-title") as HTMLElement;
			title.textContent = building.displayName;
			const level = root.querySelector(".building-level") as HTMLElement;
			level.textContent = building.level.toString();
			this.upgradeBtn = root.querySelector(".upgrade-btn") as HTMLButtonElement;
			this.onUpgradeClick = (e) => building.upgradeBuilding();
			this.upgradeBtn?.addEventListener("click", this.onUpgradeClick);
			this.element = root;

			root.classList.add("building-card-built");
		} else {
			const frag = this.template.content.cloneNode(true) as DocumentFragment;
			const root = frag.firstElementChild as HTMLElement;
			if (!root) return;
			this.element = root;
		}
		this.attachTo(this.BuildingGridEl);

		this.bindDomEvent("mouseenter", (e) => this.handleMouseEnter());
		this.bindDomEvent("mouseleave", (e) => this.handleMouseLeave());
		this.bindDomEvent("click", (e) => this.handleClick());
	}

	private handleMouseEnter() {
		if (!this.building) return;
		Tooltip.instance.show(this.element, {
			icon: this.building.iconUrl,
			name: this.building.displayName,
			type: "Building",
			description: this.building.description,
		});
	}
	private handleMouseLeave() {
		Tooltip.instance.hide();
	}

	destroy() {
		super.destroy();
		if (this.onUpgradeClick) {
			this.upgradeBtn?.removeEventListener("click", this.onUpgradeClick);
			this.onUpgradeClick = null;
		}
	}

	private handleClick() {}
	private addBuilding() {}

	private onHover() {}
}
