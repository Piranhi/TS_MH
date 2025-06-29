import { ElementType, Resistances } from "@/shared/types";

export class CharacterResistances {
	private base: Resistances;

	constructor() {
		this.base = {
			physical: 0,
			fire: 0,
			ice: 0,
			poison: 0,
			lightning: 0,
		};
	}

	/**
	 * Get base resistance for an element
	 */
	getBase(element: ElementType): number {
		return this.base[element];
	}

	/**
	 * Set base resistance (used for enemy setup or class bonuses)
	 */
	setBase(element: ElementType, value: number): void {
		this.base[element] = value;
	}

	/**
	 * Set all base resistances at once
	 */
	setAllBase(resistances: Partial<Resistances>): void {
		this.base = { ...this.base, ...resistances };
	}

	/**
	 * Get total resistance including status effects
	 * (Status effects are handled by StatusEffectManager)
	 */
	getAll(): Resistances {
		return { ...this.base };
	}
}
