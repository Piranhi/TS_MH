import { BlacksmithUpgradeSpec, ResourceRequirement } from "@/shared/types";
import { SpecRegistryBase } from "@/models/SpecRegistryBase";

export class BlacksmithUpgrade extends SpecRegistryBase<BlacksmithUpgradeSpec> {
    private constructor(private readonly spec: BlacksmithUpgradeSpec, private purchased = false) {
        super();
    }

    get id() { return this.spec.id; }
    get name() { return this.spec.name; }
    get description() { return this.spec.description; }
    get cost(): ResourceRequirement[] { return this.spec.cost; }
    get icon() { return this.spec.icon || ""; }
    get effect() { return this.spec.effect; }
    get isPurchased() { return this.purchased; }

    purchase() {
        this.purchased = true;
    }

    public static override specById = new Map<string, BlacksmithUpgradeSpec>();

    static create(id: string): BlacksmithUpgrade {
        const spec = this.specById.get(id);
        if (!spec) throw new Error(`Unknown blacksmith upgrade ${id}`);
        return new BlacksmithUpgrade(spec);
    }
}
