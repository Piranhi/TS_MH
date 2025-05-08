import { bus } from "@/EventBus";
import { TrainedStat, trainedStatStatus } from "@/features/TrainedStat/TrainedStat";
import { player } from "@/player";

interface UnlockedEls {
	prog:         HTMLDivElement;
	progressText: HTMLElement;
	assigned:     HTMLElement;
	level:        HTMLElement;
	name:         HTMLElement;
	image: 			HTMLImageElement;
  }

export class TrainedStatHolder {
	private rootEl!: HTMLElement;
	private offTick!: () => void;
	private els?: UnlockedEls;

	constructor(
		private root: HTMLElement,
		private trainedStat: TrainedStat,
	) {}

	public init(){
		this.createAndBuild();
		this.offTick = bus.on("Game:GameTick", () => this.updateElement());
	}

	public destroy(){
		this.offTick();
		this.rootEl.remove();
	}

	private createAndBuild(){
		const templates: Record<trainedStatStatus, HTMLTemplateElement | null> ={
			Unlocked: this.root.querySelector("#training-item-unlocked") as any,
			Locked: this.root.querySelector("#training-item-locked") as any,
			Hidden: null,
		};
		const tmpl = templates[this.trainedStat.status];
		if(!tmpl) return;

		const frag = tmpl.content.cloneNode(true) as DocumentFragment;
		this.rootEl = frag.firstElementChild as HTMLElement;
		this.rootEl.dataset.key = this.trainedStat.id;

		this.root.querySelector(".training-list")!.appendChild(this.rootEl);

		if (this.trainedStat.status === "Unlocked") {
			this.setupUnlocked();
		  } else {
			this.setupLocked();
		  }
	}

	// Helper to select elements
	private $<T extends Element = Element>(sel: string): T {
		const el = this.rootEl.querySelector(sel);
		if(!el){
			throw new Error(`No element matches selector "${sel}"`);
		}
		return el as T;
	  }


	  private setupUnlocked(){
		this.els = {
			prog:         this.$<HTMLDivElement>(".progress"),
			progressText: this.$<HTMLElement>(".progress-text"),
			assigned:     this.$<HTMLElement>(".training-assigned"),
			level:        this.$<HTMLElement>(".training-level"),
			name:         this.$<HTMLElement>(".training-name"),
			image:		this.$<HTMLImageElement>(".training-icon img")
		}
		this.$<HTMLButtonElement>(".control-button.minus").addEventListener("click", () => this.adjustAmount(-1));
		this.$<HTMLButtonElement>(".control-button.plus").addEventListener("click", () => this.adjustAmount(1));

		this.els.image.alt = this.trainedStat.name;

		this.updateElement();
	}

		private setupLocked(){};

		private updateElement(){
			if(this.trainedStat.status !== "Unlocked") return;

			const { prog, progressText, assigned, level, name} = this.els!;
			const pct = (this.trainedStat.progress / this.trainedStat.nextThreshold) * 100;
			name.textContent = this.trainedStat.name;
			level.textContent = `Lvl ${this.trainedStat.level}`;
			assigned.textContent = String(this.trainedStat.assignedPoints);
			prog.style.width = `${pct}%`;
			progressText.textContent = `${Math.floor(this.trainedStat.progress)} / ${this.trainedStat.nextThreshold}`;
		}

		private adjustAmount(delta: number){
			player.allocateTrainedStat(this.trainedStat.id, delta);
		}
}







	/*

	private trainedStat: TrainedStat;
	private root: HTMLElement;
	private trainingListEl: HTMLElement;
	private tmpUnlocked: HTMLTemplateElement;
	private tmpLocked: HTMLTemplateElement;


	private progEl!: HTMLDivElement;
	private assignedEl!: HTMLElement;
	private levelEl!: HTMLElement;
	private nameEl!: HTMLElement;
	private progressTextEl!: HTMLElement;

	constructor(root: HTMLElement, trainedStat: TrainedStat) {
		this.trainedStat = trainedStat;
		this.root = root;
		this.trainingListEl = root.querySelector(".training-list")!;
		this.tmpUnlocked = root.querySelector<HTMLTemplateElement>("#training-item-unlocked")!;
		this.tmpLocked = root.querySelector<HTMLTemplateElement>("#training-item-locked")!;
	}

	private $<K extends keyof HTMLElementTagNameMap>(sel: string) {
		return this.rootEl.querySelector<K>(sel)!;
	  }
	  

	public init() {
		this.createAndBuild();
		console.log("added");
		bus.on("Game:UITick", () => this.updateElement());
	}

	private createAndBuild() {

		const tmpl = {
			Unlocked: this.tmpUnlocked,
			Locked: this.tmpLocked,
			Hidden: null,
		}[this.trainedStat.status];
		if(!tmpl) return;

		const frag = tmpl.content.cloneNode(true) as DocumentFragment;
		const root = frag.firstElementChild as HTMLElement;
		if(!root) return
		
		this.trainingListEl.appendChild(root)
		this.rootEl = root

		if(this.trainedStat.status === "Unlocked"){
			this.setupUnlocked();
		} else{
			this.setupLocked();
		}
	}

	private setupUnlocked() {
		// Setup widget
		this.progEl = this.rootEl.querySelector<HTMLDivElement>(".progress")!;
		this.progressTextEl = this.rootEl.querySelector<HTMLElement>(".progress-text")!;
		this.assignedEl = this.rootEl.querySelector<HTMLElement>(".training-assigned")!;
		this.levelEl = this.rootEl.querySelector<HTMLElement>(".training-level")!;
		this.nameEl = this.rootEl.querySelector<HTMLElement>(".training-name")!;

		this.rootEl.querySelector<HTMLButtonElement>(".control-button.minus")!.addEventListener("click", () => this.adjustAmount(-1));
		this.rootEl.querySelector<HTMLButtonElement>(".control-button.plus")!.addEventListener("click", () => this.adjustAmount(1));

		this.updateElement();
	}

	private setupLocked() {}

	private updateElement() {
		if (this.trainedStat.status === "Unlocked") {
			console.log("ff");
			const pct = (this.trainedStat.progress / this.trainedStat.nextThreshold) * 100;

			this.assignedEl.textContent = this.trainedStat.assignedPoints.toString();
			this.progEl.style.width = `${pct}%`;
			this.progressTextEl.textContent = `${Math.floor(this.trainedStat.progress)} / ${this.trainedStat.nextThreshold}`;
		}
	}

	private adjustAmount(delta: number) {
		player.allocateTrainedStat(this.trainedStat.id, delta);
	}
}

*/
