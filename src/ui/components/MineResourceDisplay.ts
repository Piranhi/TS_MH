import { ConstructionResourceType } from "@/shared/types";
import { UIBase } from "./UIBase";
import { ProgressBar } from "./ProgressBar";
import { UIButton } from "./UIButton";
import { prettify } from "@/shared/utils/stringUtils";

export class MineResourceDisplay extends UIBase {
	private collectBtn: UIButton | null = null;
	constructor(private readonly resourceType: ConstructionResourceType, container: HTMLElement) {
		super();
		this.build();
		this.attachTo(container);
	}

	public tick(dt: number) {}

	private build() {
		const rowEl = document.createElement("div");
		rowEl.className = "mine-resource-row";

		const iconEl = document.createElement("div");
		iconEl.className = "mine-resource-icon";
		iconEl.innerHTML = "⛏️";
		rowEl.appendChild(iconEl);

		const infoContainerEl = document.createElement("div");
		infoContainerEl.className = "mine-resource-info";

		const titleEl = document.createElement("span");
		titleEl.className = "mine-resource-title";
		titleEl.textContent = prettify(this.resourceType.toString());
		infoContainerEl.appendChild(titleEl);

		const progressContainerEl = document.createElement("div");
		progressContainerEl.className = "mine-resource-progress";
		infoContainerEl.appendChild(progressContainerEl);
		const progressEl = new ProgressBar({ container: progressContainerEl, maxValue: 100, initialValue: 50 });

		const timerEl = document.createElement("span");
		timerEl.className = "mine-resource-timer";
		timerEl.textContent = "Ready in 2m 14s";
		infoContainerEl.appendChild(timerEl);
		rowEl.appendChild(infoContainerEl);
		const collectBtn = new UIButton(rowEl, {
			text: "Collect",
			className: "mine-resource-collect-btn",
			onClick: () => {
				console.log("Collected resource!");
				// your collect logic...
			},
		});
		this.element = rowEl;
	}

	public override destroy(): void {
		// 1️⃣ destroy any child components/listeners
		if (this.collectBtn) {
			this.collectBtn.destroy();
		}
		// 2️⃣ then call the parent cleanup
		super.destroy();
	}
}
