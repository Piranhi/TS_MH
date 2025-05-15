import { bus } from "@/core/EventBus";
import { TrainedStatStatus } from "@/models/Stats";
import { TrainedStat } from "@/models/TrainedStat";
import { TrainedStatManager } from "@/models/TrainedStatManager";
import { Player } from "@/models/player";

interface UnlockedEls {
	prog: HTMLDivElement;
	progressText: HTMLElement;
	assigned: HTMLElement;
	level: HTMLElement;
	name: HTMLElement;
	image: HTMLImageElement;
}

export class TrainedStatDisplay {
	private rootEl!: HTMLElement;
	private offTick!: () => void;
	private els?: UnlockedEls;
	private manager!: TrainedStatManager;

	constructor(private root: HTMLElement, private trainingListEl: HTMLElement, private trainedStat: TrainedStat) {}

	public init() {
		this.createAndBuild();
		this.offTick = bus.on("Game:GameTick", () => this.updateElement());
		this.manager = Player.getInstance().trainedStatManager;
	}

	public destroy() {
		this.offTick();
		this.root.remove();
	}

	private createAndBuild() {
		const templates: Record<TrainedStatStatus, HTMLTemplateElement | null> = {
			Unlocked: this.root.querySelector("#training-item-unlocked") as any,
			Locked: this.root.querySelector("#training-item-locked") as any,
			Hidden: null,
		};
		const tmpl = templates[this.trainedStat.status];
		if (!tmpl) return;

		const frag = tmpl.content.cloneNode(true) as DocumentFragment;
		this.rootEl = frag.firstElementChild as HTMLElement;
		this.rootEl.dataset.key = this.trainedStat.id;

		this.trainingListEl.appendChild(this.rootEl);
		if (this.trainedStat.status === "Unlocked") {
			this.setupUnlocked();
		} else {
			this.setupLocked();
		}
	}

	// Helper to select elements
	private $<T extends Element = Element>(sel: string): T {
		const el = this.rootEl.querySelector(sel);
		if (!el) {
			throw new Error(`No element matches selector "${sel}"`);
		}
		return el as T;
	}

	private setupUnlocked() {
		this.els = {
			prog: this.$<HTMLDivElement>(".progress"),
			progressText: this.$<HTMLElement>(".progress-text"),
			assigned: this.$<HTMLElement>(".training-assigned"),
			level: this.$<HTMLElement>(".training-level"),
			name: this.$<HTMLElement>(".training-name"),
			image: this.$<HTMLImageElement>(".training-icon img"),
		};
		this.$<HTMLButtonElement>(".control-button.minus").addEventListener("click", () => this.adjustAmount(-1));
		this.$<HTMLButtonElement>(".control-button.plus").addEventListener("click", () => this.adjustAmount(1));

		this.els.image.alt = this.trainedStat.name;

		this.updateElement();
	}

	private setupLocked() {}

	private updateElement() {
		if (this.trainedStat.status !== "Unlocked") return;

		const { prog, progressText, assigned, level, name } = this.els!;
		const pct = (this.trainedStat.progress / this.trainedStat.nextThreshold) * 100;
		name.textContent = this.trainedStat.name;
		level.textContent = `Lvl ${this.trainedStat.level}`;
		assigned.textContent = String(this.trainedStat.assignedPoints);
		prog.style.width = `${pct}%`;
		progressText.textContent = `${Math.floor(this.trainedStat.progress)} / ${this.trainedStat.nextThreshold}`;
	}

	private adjustAmount(delta: number) {
		this.manager.allocateTrainedStat(this.trainedStat.id, delta);
	}
}
