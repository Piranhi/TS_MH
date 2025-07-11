import { Tooltip } from "./Tooltip";
import { Building } from "@/features/settlement/Building";
import { UIBase } from "./UIBase";
import { ProgressBar } from "./ProgressBar";
import { bus } from "@/core/EventBus";
import { UIButton } from "./UIButton";

export class BuildingDisplay extends UIBase {
	private levelEl!: HTMLElement;
	private progress!: ProgressBar;
	private spendContainer!: HTMLElement;
	private progressText!: HTMLElement;

	constructor(private readonly containerEl: HTMLElement, private readonly template: HTMLTemplateElement, private readonly building: Building) {
		super();
		this.buildDisplay();
		this.buildButtons();
		this.update();
		this.setupEvents();
	}

	private buildDisplay() {
		const frag = this.template.content.cloneNode(true) as DocumentFragment;
		const root = frag.firstElementChild as HTMLElement;
		this.element = root;

		const iconEl = root.querySelector(".building-icon") as HTMLElement;
		if (iconEl && this.building.iconUrl) {
			iconEl.style.backgroundImage = `url(${this.building.iconUrl})`;
		}

		const titleEl = root.querySelector(".building-title") as HTMLElement;
		titleEl.textContent = this.building.displayName;

		this.levelEl = root.querySelector(".building-level") as HTMLElement;
		this.spendContainer = this.byId("building-spend-points") as HTMLElement;
		const progressHolder = root.querySelector(".progress-holder") as HTMLElement;
		this.progressText = progressHolder.querySelector(".progress-text") as HTMLElement;

		this.progress = new ProgressBar({ container: progressHolder, initialValue: 0, maxValue: 1 });

		this.attachTo(this.containerEl);
	}

	private setupEvents() {
		this.bindDomEvent(this.element, "mouseenter", () => this.handleMouseEnter());
		this.bindDomEvent(this.element, "mouseleave", () => this.handleMouseLeave());
		bus.on("settlement:changed", () => this.update());
		bus.on("settlement:buildPointsChanged", () => this.updateButtons());
	}

	private buildButtons() {
		this.spendContainer.innerHTML = "";
		new UIButton(this.spendContainer, {
			text: "+1",
			onClick: () => this.spendPoints(1),
			size: "small",
		});
		new UIButton(this.spendContainer, {
			text: "+10",
			onClick: () => this.spendPoints(10),
			size: "small",
		});
		new UIButton(this.spendContainer, {
			text: "+100",
			onClick: () => this.spendPoints(100),
			size: "small",
		});
		new UIButton(this.spendContainer, {
			text: "+Half",
			onClick: () => this.spendPoints(Math.floor(this.context.settlement.totalBuildPoints / 2)),
			size: "small",
		});
		new UIButton(this.spendContainer, {
			text: "+Max",
			onClick: () => this.spendPoints(this.context.settlement.totalBuildPoints),
			size: "small",
		});
		new UIButton(this.spendContainer, {
			text: "Eff +10g",
			onClick: () => this.allocateGold(10),
			size: "small",
		});
		new UIButton(this.spendContainer, {
			text: "Eff +100g",
			onClick: () => this.allocateGold(100),
			size: "small",
		});
		new UIButton(this.spendContainer, {
			text: "Stop Eff",
			onClick: () => this.allocateGold(0),
			size: "small",
		});
	}

	private updateButtons() {
		// no-op for now (placeholder if we want to disable when 0)
	}

	private spendPoints(amt: number) {
		if (amt <= 0) return;
		this.context.settlement.spendBuildPoints(this.building.id, amt);
	}

	private update() {
		const snap = this.building.snapshot;
		this.levelEl.textContent = `Lv ${snap.level}`;
		this.progress.setMax(snap.nextUnlock);
		this.progress.setValue(snap.pointsAllocated);
		this.progressText.textContent = `${snap.pointsAllocated} / ${snap.nextUnlock}`;
	}
	private handleMouseEnter() {
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

	private allocateGold(amt: number) {
		this.building.allocateGold(amt);
	}
}
