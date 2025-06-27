import { UIBase } from "./UIBase";
import { ProgressBar } from "./ProgressBar";
import { UIButton } from "./UIButton";
import { formatTime } from "@/shared/utils/stringUtils";
import { MineManager } from "@/features/mine/MineManager";

export class MineShaftDisplay extends UIBase {
	private progress!: ProgressBar;
	private timerEl!: HTMLElement;
	private openBtn!: UIButton;

	constructor(
		private readonly manager: MineManager,
		private readonly index: number,
		container: HTMLElement,
		private readonly logFn: (msg: string) => void
	) {
		super();
		this.element = document.createElement("div");
		this.element.className = "basic-subsection-row";
		this.build();
		this.attachTo(container);
	}

	private build() {
		const iconEl = document.createElement("div");
		iconEl.className = "mine-resource-icon";
		iconEl.innerHTML = "⛏️";
		this.element.appendChild(iconEl);

		const infoContainer = document.createElement("div");
		infoContainer.className = "mine-resource-info";
		this.element.appendChild(infoContainer);

		const titleEl = document.createElement("span");
		titleEl.className = "basic-subtitle";
		titleEl.textContent = `Shaft ${this.index + 1}`;
		infoContainer.appendChild(titleEl);

		const progressContainer = document.createElement("div");
		progressContainer.className = "mine-resource-progress";
		infoContainer.appendChild(progressContainer);
		this.progress = new ProgressBar({
			container: progressContainer,
			maxValue: this.manager.getDuration(this.index),
			initialValue: 0,
		});

		this.timerEl = document.createElement("span");
		this.timerEl.className = "basic-text-footer";
		infoContainer.appendChild(this.timerEl);

		this.openBtn = new UIButton(this.element, {
			text: "Open",
			className: "mine-resource-collect-btn",
			onClick: () => this.handleOpen(),
		});
	}

	private handleOpen() {
		const rewards = this.manager.openShaft(this.index);
		const parts = Object.entries(rewards).map(([id, qty]) => `${qty} ${id}`);
		if (parts.length > 0) this.logFn(`Shaft ${this.index + 1}: +${parts.join(", ")}`);
	}

	public tick() {
		const timer = this.manager.getTimer(this.index);
		const duration = this.manager.getDuration(this.index);
		const remaining = Math.max(duration - timer, 0);
		this.progress.setMax(duration);
		this.progress.setValue(timer);
		this.timerEl.textContent = remaining > 0 ? `Ready in ${formatTime(remaining * 1000)}` : "Ready";
		this.openBtn.setVisibleComponent(this.manager.isReady(this.index));
		this.progress.setVisibleComponent(!this.manager.isReady(this.index));
	}
}
