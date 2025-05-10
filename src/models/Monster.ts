export interface MonsterSpec {
    id: string;
    displayName: string;
    rarity: "common" | "uncommon" | "rare";
    baseStats: { hp: number; attack: number; defence: number; speed: number };
    attacks: string[];
}

export class Monster {
    // Registry.
    private static specById = new Map<string, MonsterSpec>();
    static registerSpecs(specs: MonsterSpec[]) {
        specs.forEach((s) => this.specById.set(s.id, s));
    }

    static create(id: string): Monster {
        const spec = this.specById.get(id);
        if (!spec) throw new Error(`Unknown monster "${id}"`);
        return new Monster(spec);
    }

    private constructor(private readonly spec: MonsterSpec) {}

    /* --- simple getters --- */
    get id() {
        return this.spec.id;
    }
    get displayName() {
        return this.spec.displayName;
    }
    get rarity() {
        return this.spec.rarity;
    }
    get baseStats() {
        return this.spec.baseStats;
    }

    /* you can add more behaviour later */
}
