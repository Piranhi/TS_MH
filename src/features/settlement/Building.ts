import { BuildingSnapshot, BuildingSpec, BuildingState, BuildingUnlockStatus } from "@/shared/types";
import { bus } from "@/core/EventBus";
import { SpecRegistryBase } from "@/models/SpecRegistryBase";
import { BigNumber } from "@/models/utils/BigNumber";

export class Building extends SpecRegistryBase<BuildingSpec> {
	private constructor(private readonly spec: BuildingSpec, private state: BuildingState) {
		super();
		bus.on("Game:GameTick", (dt) => this.handleTick(dt));
	}

	private handleTick(delta: number) {}

	public upgradeBuilding() {
		this.state.level++;
		bus.emit("settlement:changed");
	}

	public spendPoints(amt: number) {
		this.state.unlockPointsSpent += amt;
		if (this.state.unlockPointsSpent === this.spec.baseCost) {
			this.state.unlockStatus = "unlocked";
		}
	}

	public getUnlockCostData() {
		return { cost: this.spec.baseCost, spent: this.state.unlockPointsSpent };
	}

	get id() {
		return this.spec.id;
	}

	get displayName(): string {
		return this.spec.displayName;
	}

	get level() {
		return this.state.level;
	}

	get progress() {
		return this.state.progress;
	}

	get iconUrl() {
		return this.spec.icon;
	}

	get description() {
		return this.spec.description;
	}

	get buildingStatus(): BuildingUnlockStatus {
		return this.state.unlockStatus;
	}

	set buildingStatus(newStatus: BuildingUnlockStatus) {
		this.state.unlockStatus = newStatus;
	}

	get snapshot(): BuildingSnapshot {
		return {
			displayName: this.spec.displayName,
			level: this.state.level,
			progress: this.state.progress,
		};
	}

	toJSON() {
		return {
			__type: "Building",
			spec: this.spec.id,
			state: this.state,
		};
	}

	static fromJSON(raw: any) {
		const spec = this.specById.get(raw.spec);
		if (!spec) throw new Error(`Unknown Building "${raw.spec}"`);
		return new Building(spec, raw.state);
	}

	public static override specById = new Map<string, BuildingSpec>();

	static create(id: string): Building {
		const spec = this.specById.get(id);
		if (!spec) throw new Error(`Unknown building "${id}"`);

		const defaultState: BuildingState = {
			unlockStatus: "hidden",
			unlockPointsSpent: 0,
			level: 2,
			progress: new BigNumber(0),
		};
		return new Building(spec, defaultState);
	}
}
