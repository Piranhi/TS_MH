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

    /**
     * Return all specs whose optional `tags` array contains *every* one
     * of the tags in `filterTags`.
     */
    static getSpecsByTags<U extends Identifiable & { tags?: string[] }>(this: { specById: Map<string, U> }, filterTags: string[]): U[] {
        return [...this.specById.values()].filter((spec) =>
            // spec.tags must include *all* filterTags
            filterTags.every((tag) => spec.tags?.includes(tag) ?? false),
        );
    }

    /**
     * Return the *first* spec matching *all* of `filterTags`, or `undefined`.
     */
    static getSpecByTags<U extends Identifiable & { tags?: string[] }>(this: { specById: Map<string, U> }, filterTags: string[]): U | undefined {
        return [...this.specById.values()].find((spec) => filterTags.every((tag) => spec.tags?.includes(tag) ?? false));
    }
}
