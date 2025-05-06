import { bus } from "@/EventBus";
import { TrainedStat, trainedStatStatus } from "@/TrainedStat";
import { player } from "@/player";

export class TrainedStatHolder {
	private trainedStat: TrainedStat;
	private root: HTMLElement;
	private trainingListEl: HTMLElement;
	private tmpUnlocked: HTMLTemplateElement;
	private tmpLocked: HTMLTemplateElement;
	private statElRoot: HTMLElement

	constructor(root: HTMLElement, trainedStat: TrainedStat) {
		this.trainedStat = trainedStat;
		this.root = root;
		this.trainingListEl = root.querySelector(".training-list")!;
		this.tmpUnlocked = root.querySelector<HTMLTemplateElement>("#training-item-unlocked")!;
		this.tmpLocked = root.querySelector<HTMLTemplateElement>("#training-item-locked")!;
	}

	public init() {
		this.createElement();
		console.log("added");
		bus.on("Game:UITick", (dt) => this.updateElement(dt))
	}

	private createElement() {

		// Create a map of templates to use based on the status
		const templateMap: Record<trainedStatStatus, HTMLTemplateElement | null> = {
			Unlocked: this.tmpUnlocked,
			Locked: this.tmpLocked,
			Hidden: null,
		};

		// Select the template, back out if null
		const template = templateMap[this.trainedStat.status];
		if (!template) return;
		const clone = template.content.cloneNode(true) as DocumentFragment;
		this.statElRoot = clone.firstElementChild as HTMLElement;
		if(!this.statElRoot){
			console.error("Templatre had no root element", template);
			return;
		}

        if(this.trainedStat.status === "Unlocked"){
		// Setup widget
		const progEl = this.statElRoot.querySelector<HTMLDivElement>(".progress")
		if (!progEl) {
			console.error("Couldn’t find .progress inside", this.statElRoot);
		  } else {
			// 2) Compute % with explicit parens so there’s no confusion
			const pct = (this.trainedStat.progress / this.trainedStat.nextThreshold) * 100;
			progEl.style.width = `${pct}%`;

			const txtEl = this.statElRoot.querySelector<HTMLElement>(".progress-text");
			if (txtEl) {
			  txtEl.textContent = `${Math.floor(this.trainedStat.progress)} / ${this.trainedStat.nextThreshold}`;
			}
		  }

		 this.statElRoot.querySelector<HTMLButtonElement>(".control-button.minus")!.addEventListener("click", () => this.adjustAmount(-1) )
		 this.statElRoot.querySelector<HTMLButtonElement>(".control-button.plus")!.addEventListener("click", () =>  this.adjustAmount(1) )

        }
		this.trainingListEl.appendChild(clone);
	}

	private updateElement(delta: number){
		if(this.trainedStat.status === "Unlocked"){
			// Setup widget
			const progEl = this.statElRoot.querySelector<HTMLDivElement>(".progress")
			if (!progEl) {
				console.error("Couldn’t find .progress inside", this.statElRoot);
			  } else {
				// 2) Compute % with explicit parens so there’s no confusion
				const pct = (this.trainedStat.progress / this.trainedStat.nextThreshold) * 100;
				progEl.style.width = `${pct}%`;
	
				const txtEl = this.statElRoot.querySelector<HTMLElement>(".progress-text");
				if (txtEl) {
				  txtEl.textContent = `${Math.floor(this.trainedStat.progress)} / ${this.trainedStat.nextThreshold}`;
				}
			}
			}
	}

	private adjustAmount(delta: number){
		player.allocateTrainedStat(this.trainedStat.id, delta)
	}

}
