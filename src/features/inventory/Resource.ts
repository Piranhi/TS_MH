import { SpecRegistryBase } from "@/models/SpecRegistryBase";
import { ResourceSpec } from "@/shared/types";

export class Resource extends SpecRegistryBase<ResourceSpec> {
	private constructor(private readonly spec: ResourceSpec) {
		super();
	}

	public init() {}

	get id() {
		return this.spec.id;
	}
	get name() {
		return this.spec.name;
	}
	get iconUrl() {
		return this.spec.iconUrl;
	}
	get description() {
		return this.spec.description;
	}
	get requires() {
		return this.spec.requires;
	}
	get craftTime() {
		return this.spec.craftTime;
	}
	get tier() {
		return this.spec.tier;
	}
	get unlock() {
		return this.spec.unlock;
	}

	// ─────────────────────────────────────────────────────

	public static override specById = new Map<string, ResourceSpec>();

	static create(id: string): Resource {
		const spec = this.specById.get(id);
		if (!spec) throw new Error(`Unknown resource "${id}"`);
		return new Resource(spec);
	}
}
