import { UIBase } from "./UIBase";
import { ProgressBar } from "./ProgressBar";
import { formatNumberShort } from "@/shared/utils/stringUtils";

export interface CostDisplay {
	icon: string;
	amount: number | string;
}

export interface UpgradeSelectionData {
	id: string;
	title: string;
	description: string;
	costs: CostDisplay[];
	level?: number;
	maxLevel?: number;
	progress?: number;
	requiredTime?: number;
	purchased?: boolean;
	canAfford?: boolean;
	buttonOverride?: string;
}

export interface UpgradeSelectionComponentOptions {
	parent: HTMLElement;
	data: UpgradeSelectionData;
	onClick?: (id: string) => void;
}

export class UpgradeSelectionComponent extends UIBase {
        private data: UpgradeSelectionData;
        private progressBar?: ProgressBar;
        private timerEl?: HTMLElement;
        private levelEl?: HTMLElement;
        private titleEl!: HTMLElement;
        private descEl!: HTMLElement;
        private actionBtn!: HTMLButtonElement;

	constructor(options: UpgradeSelectionComponentOptions) {
		super();
		const { parent, data, onClick } = options;
		this.data = { ...data };
		const root = document.createElement("div");
		root.className = "upgrade-card";
		if (data.purchased) root.classList.add("purchased");

                const title = document.createElement("div");
                title.className = "upgrade-title";
                title.textContent = data.title;
                root.appendChild(title);
                this.titleEl = title;

                const desc = document.createElement("div");
                desc.className = "upgrade-desc";
                desc.textContent = data.description;
                root.appendChild(desc);
                this.descEl = desc;

                if (data.level !== undefined && data.maxLevel !== undefined) {
                        const level = document.createElement("div");
                        level.className = "upgrade-level";
                        level.textContent = `${data.level}/${data.maxLevel}`;
                        root.appendChild(level);
                        this.levelEl = level;
                }

		if (data.requiredTime) {
			const progWrap = document.createElement("div");
			progWrap.className = "upgrade-progress";
			this.progressBar = new ProgressBar({
				container: progWrap,
				maxValue: data.requiredTime,
				initialValue: data.progress ?? 0,
			});
			this.timerEl = document.createElement("span");
			this.timerEl.className = "upgrade-timer";
			progWrap.appendChild(this.timerEl);
			root.appendChild(progWrap);
			this.updateTimer();
		}

		const footer = document.createElement("div");
		footer.className = "upgrade-footer";

		const costContainer = document.createElement("div");
		costContainer.className = "upgrade-costs";
		data.costs.forEach((c) => {
			const span = document.createElement("span");
			span.className = "upgrade-cost";
			const img = document.createElement("img");
			img.src = c.icon;
			img.className = "upgrade-cost-icon";
			span.appendChild(img);
			const amt = document.createElement("span");
			amt.textContent = formatNumberShort(Number(c.amount));
			span.appendChild(amt);
			costContainer.appendChild(span);
		});
		footer.appendChild(costContainer);

                const btn = document.createElement("button");
                btn.className = "ui-button upgrade-action-btn";
                btn.textContent = data.purchased ? "Purchased" : data.buttonOverride || "Buy";
                if (data.purchased || data.canAfford === false) btn.disabled = true;
                this.actionBtn = btn;
		if (onClick) {
			this.bindDomEvent(btn, "click", () => onClick(data.id));
		}
		footer.appendChild(btn);
		//if (data.canAfford === false) btn.classList.add("disabled");

		root.appendChild(footer);
		parent.appendChild(root);
		this.element = root;
	}

	public getData(): UpgradeSelectionData {
		return this.data;
	}

        public updateProgress(value: number) {
                if (!this.progressBar) return;
                this.data.progress = value;
                this.progressBar.setValue(value);
                this.updateTimer();
        }

        public update(data: UpgradeSelectionData) {
                this.data = { ...data };
                this.titleEl.textContent = data.title;
                this.descEl.textContent = data.description;
                if (this.levelEl && data.level !== undefined && data.maxLevel !== undefined) {
                        this.levelEl.textContent = `${data.level}/${data.maxLevel}`;
                }

                if (this.progressBar && data.requiredTime !== undefined) {
                        this.progressBar.setMax(data.requiredTime);
                        this.updateProgress(data.progress ?? 0);
                }

                if (data.purchased) {
                        this.element.classList.add("purchased");
                        this.actionBtn.textContent = "Purchased";
                        this.actionBtn.disabled = true;
                } else {
                        this.element.classList.remove("purchased");
                        this.actionBtn.textContent = data.buttonOverride || "Buy";
                        this.actionBtn.disabled = data.canAfford === false;
                }
        }

	private updateTimer() {
		if (!this.timerEl || this.data.requiredTime === undefined) return;
		const remaining = Math.max(0, this.data.requiredTime - (this.data.progress ?? 0));
		const mins = Math.floor(remaining / 60);
		const secs = Math.floor(remaining % 60);
		this.timerEl.textContent = `${mins}m ${secs}s`;
	}

	override destroy(): void {
		this.progressBar?.destroy();
		super.destroy();
	}
}
