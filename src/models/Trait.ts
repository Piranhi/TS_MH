import { SpecRegistryBase } from "./SpecRegistryBase";
import { TraitSpec, TraitRarity } from "@/shared/types";
import { BalanceCalculators } from "@/balance/GameBalance";

export class Trait extends SpecRegistryBase<TraitSpec> {
    private constructor(public readonly spec: TraitSpec) {
        super();
    }

    get id() {
        return this.spec.id;
    }
    get name() {
        return this.spec.name;
    }
    get description() {
        return this.spec.description;
    }
    get rarity() {
        return this.spec.rarity;
    }

    static override specById = new Map<string, TraitSpec>();

    static create(id: string): Trait {
        const spec = this.specById.get(id);
        if (!spec) throw new Error(`Unknown trait "${id}"`);
        return new Trait(spec);
    }

    static getRandomTrait(): Trait {
        const rarity = BalanceCalculators.getTraitRarity();
        const candidates = [...this.specById.values()].filter(
            (t) => t.rarity === rarity
        );
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        return new Trait(pick);
    }
}
