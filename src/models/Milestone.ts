// src/models/Milestone.ts
import { SpecRegistryBase, Identifiable } from "./SpecRegistryBase";

export type MilestoneType = "run" | "persistent" | "both";

export interface MilestoneSpec extends Identifiable {
	id: string;
	name: string;
	description: string;
	type: MilestoneType;
}

/**
 * Milestone represents a single milestone specification.
 * Uses the same pattern as Monster, Equipment, etc.
 */
export class Milestone extends SpecRegistryBase<MilestoneSpec> {
	public readonly name: string;
	public readonly description: string;
	public readonly type: MilestoneType;

	constructor(spec: MilestoneSpec) {
		super();
		this.name = spec.name;
		this.description = spec.description;
		this.type = spec.type;
	}

	// Override the static specById property like other specs do
	public static override specById = new Map<string, MilestoneSpec>();
}
