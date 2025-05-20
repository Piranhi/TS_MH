import { Tooltip } from "./Tooltip";
import { Building } from "@/features/settlement/Building";
import { UIBase } from "./UIBase";
import { ProgressBar } from "./ProgressBar";
import { Player } from "@/models/player";

export class BuildingDisplay extends UIBase {
	private onUpgradeClick: ((e: Event) => void) | null = null;
	private onSpendClick: ((e: Event) => void) | null = null;
	private upgradeBtn: HTMLButtonElement | null = null;
	private buildingContentsEl!: HTMLElement;
	//private rootEl!: HTMLElement;
	constructor(private BuildingGridEl: HTMLElement, private template: HTMLTemplateElement, private building: Building) {
		super();

		//Build Base Card
		const frag = this.template.content.cloneNode(true) as DocumentFragment;
		const root = frag.firstElementChild as HTMLElement;
		if (!root) return;
		const title = root.querySelector(".building-title") as HTMLElement;
		title.textContent = building.displayName;
		this.element = root;
		this.buildingContentsEl = this.$(".building-contents");

		if (building.buildingStatus === "construction") this.buildConstructionCard();
		if (building.buildingStatus === "unlocked") this.buildUnlockedCard();

		this.attachTo(this.BuildingGridEl);
	}

	private buildConstructionCard() {
		this.buildingContentsEl.innerHTML = "";
		const title = document.createElement("div");
		title.classList.add("building-info");
		title.textContent = "Construction Progress";
		this.buildingContentsEl.appendChild(title);
		const unlockCostData = this.building.getUnlockCostData();
		console.log(unlockCostData);
		const constructionProgress = new ProgressBar({
			container: this.buildingContentsEl,
			templateId: undefined,
			initialValue: unlockCostData.spent,
			maxValue: unlockCostData.cost,
		});
		const spendPointsBtn = document.createElement("button");
		spendPointsBtn.textContent = "+10";
		spendPointsBtn.classList.add("spend-points-btn");
		this.buildingContentsEl.appendChild(spendPointsBtn);
		this.onSpendClick = (e) => this.spendPoints(10);
		spendPointsBtn.addEventListener("click", this.onSpendClick);
	}

	private spendPoints(amt: number) {
		Player.getInstance().settlementManager.spendUnlockPoints(this.building.id, 10);
	}

	private buildUnlockedCard() {
		const level = this.element.querySelector(".building-level") as HTMLElement;
		level.textContent = this.building.level.toString();
		this.upgradeBtn = this.element.querySelector(".upgrade-btn") as HTMLButtonElement;
		this.onUpgradeClick = (e) => this.building.upgradeBuilding();
		this.upgradeBtn?.addEventListener("click", this.onUpgradeClick);
		this.element = this.element;

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
