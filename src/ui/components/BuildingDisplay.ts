import { Tooltip } from "./Tooltip";
import { Building } from "@/features/settlement/Building";
import { UIBase } from "./UIBase";
import { ProgressBar } from "./ProgressBar";
import { bus } from "@/core/EventBus";

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
		this.spendContainer = root.querySelector(".spend-points") as HTMLElement;
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
		const amounts = [1, 10, 100];
		amounts.forEach((amt) => {
			const btn = document.createElement("button");
			btn.textContent = `+${amt}`;
			btn.classList.add("spend-btn");
			btn.addEventListener("click", () => this.spendPoints(amt));
			this.spendContainer.appendChild(btn);
		});
		const halfBtn = document.createElement("button");
		halfBtn.textContent = "+Half";
		halfBtn.classList.add("spend-btn");
		halfBtn.addEventListener("click", () => {
			const amt = Math.floor(this.context.settlement.totalBuildPoints / 2);
			this.spendPoints(amt);
		});
		this.spendContainer.appendChild(halfBtn);

		const maxBtn = document.createElement("button");
		maxBtn.textContent = "+Max";
		maxBtn.classList.add("spend-btn");
		maxBtn.addEventListener("click", () => {
			const amt = this.context.settlement.totalBuildPoints;
			this.spendPoints(amt);
		});
		this.spendContainer.appendChild(maxBtn);
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
}
