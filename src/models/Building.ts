import { BuildingSpec, BuildingState } from "@/shared/types";
import { SpecRegistryBase } from "./SpecRegistryBase";
import { BigNumber } from "./utils/BigNumber";

export class Building extends SpecRegistryBase<BuildingSpec> {
	private constructor(private readonly spec: BuildingSpec, private state: BuildingState) {
		super();
	}

	public upgradeBuilding() {
		this.state.level++;
	}

	get id() {
		return this.spec.id;
	}
	/* 	toJSON() {
		return {
			__type: "Equipment",
			spec: this.spec.id,
			state: this.state,
		};
	}

	static fromJSON(raw: any) {
		const spec = this.specById.get(raw.spec);
		if (!spec) throw new Error(`Unknown equipment "${raw.spec}"`);
		return new Equipment(spec, raw.state);
	} */

	public static override specById = new Map<string, BuildingSpec>();
	static create(id: string): Building {
		const spec = this.specById.get(id);
		if (!spec) throw new Error(`Unknown building "${id}"`);

		const defaultState: BuildingState = {
			level: 1,
			progress: new BigNumber(0),
		};
		return new Building(spec, defaultState);
	}
}
