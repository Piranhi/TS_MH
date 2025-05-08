import { bus } from "@/EventBus";

// Import data
export interface CardSpec {
	id: string;
	name: string;
	description: string;
	rarity: CardRarity;
	statMod: StatMod;
	baseGainRate: number;
}

// Instance data
export interface CardState {
	specId: string;
	status: CardStatus;
	level: number;
	progress: number;
}

export type CardStatus = "Equipped" | "Unequipped" | "Hidden";
export type CardRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "unique";
export type StatMod = Partial<{
	attackBase: number;
	atClassCardStatModtackMulti: number;
	defenceBase: number;
	defenceMulti: number;
	speedBase: number;
	speedMulti: number;
}>;

export class ClassCard {
	private spec: CardSpec;
	private state: CardState;

	constructor(spec: CardSpec, state: CardState) {
		this.spec = spec;
		this.state = state;
	}

	public init() {}

	public equip() {
		this.state.status = "Equipped";
	}

	public unequip() {
		this.state.status = "Unequipped";
	}

	public gainExp(monsterExp: number = 1) {
		const gain = this.spec.baseGainRate * monsterExp;
		this.state.progress += gain;
		if (this.state.progress >= this.nextThreshold()) {
			this.levelUp();
		}
	}

	private nextThreshold() {
		return this.state.level * 100;
	}

	private levelUp() {
		this.state.progress -= this.nextThreshold();
		this.state.level++;
		bus.emit("classCard:levelUp", this.spec.id);
	}
}
