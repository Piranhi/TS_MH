export interface Identifiable {
	id: string;
}

export abstract class SpecRegistryBase<TSpec extends Identifiable> {
	/** Each concrete *sub‑class* will get its own map instance */
	static specById: Map<string, any>;

	static registerSpecs<T extends Identifiable>(this: { specById: Map<string, T> }, specs: T[]): void {
		specs.forEach((s) => this.specById.set(s.id, s));
	}

	static getSpec<T extends Identifiable>(this: { specById: Map<string, T> }, id: string): T | undefined {
		return this.specById.get(id);
	}

	static getAllSpecs<T extends Identifiable>(this: { specById: Map<string, T> }): readonly T[] {
		return [...this.specById.values()];
	}
}
