import { ElementType, Resistances } from "@/shared/types";

// CharacterResistances.ts
export class CharacterResistances {
	private base: Resistances;
	private gear: Resistances;
	private temp: Resistances;

	constructor() {
		this.base = this.createEmpty();
		this.gear = this.createEmpty();
		this.temp = this.createEmpty();
	}

	private createEmpty(): Resistances {
		return { fire: 0, ice: 0, poison: 0, lightning: 0, physical: 0 };
	}

	get(element: ElementType): number {
		return this.base[element] + this.gear[element] + this.temp[element];
	}

	setBase(element: ElementType, value: number): void {
		this.base[element] = value;
	}

	setEquipment(resistances: Partial<Resistances>): void {
		this.gear = { ...this.createEmpty(), ...resistances };
	}

	addTemp(element: ElementType, value: number): void {
		this.temp[element] += value;
	}

	clearTemp(): void {
		this.temp = this.createEmpty();
	}

	// Debug helper
	getAll(): { base: Resistances; gear: Resistances; temp: Resistances; total: Resistances } {
		return {
			base: { ...this.base },
			gear: { ...this.gear },
			temp: { ...this.temp },
			total: {
				fire: this.get("fire"),
				ice: this.get("ice"),
				poison: this.get("poison"),
				lightning: this.get("lightning"),
				physical: this.get("physical"),
			},
		};
	}
}
