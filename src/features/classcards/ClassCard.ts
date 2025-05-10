import { bus } from "@/core/EventBus";
import { InventoryItem, ItemCategory } from "@/shared/types";

// Import data
export interface CardSpec {
	id: string;
	name: string;
	description: string;
	iconUrl: string;
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

export class ClassCard implements InventoryItem {

    // Registry
    private static specById = new Map<string, CardSpec>();
    static registerSpecs(specs: CardSpec[]){
        specs.forEach(s => this.specById.set(s.id, s));
    }
    // Build a brand new card with default state;
    static create(id: string): ClassCard{
    const spec = this.specById.get(id)
    if(!spec) throw new Error(`Unknown card "${id}"`);

    const defaultState: CardState = {
        specId: spec.id,
        status: "Unequipped",
        level: 1,
        progress: 0
    }
    return new ClassCard(spec, defaultState);
    }



    // Rehydrate from a previous saved JSON state
    static fromState(state: CardState): ClassCard{
        const spec = this.specById.get(state.specId);
        if(!spec) throw new Error(`Unknown card "${state.specId}"`);
        return new ClassCard(spec, state);
    }

    private spec: CardSpec;
	private state: CardState;
	readonly category: ItemCategory = "classCard";

      /** always private—use the factories below instead */
	private constructor(spec: CardSpec, state: CardState) {
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

	public getBonuses(): StatMod{
		return this.spec.statMod;
	}
	// ─── InventoryItem members ───────────────────────────
	get id() {
		return this.state.specId;
	}
	get name() {
		return this.spec.name;
	}
	get iconUrl() {
		return this.spec.iconUrl;
	}
	get rarity() {
		return this.spec.rarity;
	}
	get quantity() {
		return 1;
	}
	// ─────────────────────────────────────────────────────




}

