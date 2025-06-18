import { BuildingSnapshot, BuildingSpec, BuildingState, BuildingUnlockStatus } from "@/shared/types";
import { bus } from "@/core/EventBus";
import { SpecRegistryBase } from "@/models/SpecRegistryBase";
import { BalanceCalculators, GAME_BALANCE } from "@/balance/GameBalance";

export class Building extends SpecRegistryBase<BuildingSpec> {
	private constructor(private readonly spec: BuildingSpec, private state: BuildingState) {
		super();
		bus.on("Game:GameTick", (dt) => this.handleTick(dt));
	}

	private handleTick(delta: number) {}

	public upgradeBuilding() {
		if (this.state.level === GAME_BALANCE.buildings.maxlevel) return;
		this.state.level++;
		if (this.state.unlockStatus === "construction") this.state.unlockStatus = "unlocked";
		bus.emit("settlement:changed");
	}

	public spendPoints(amt: number) {
		this.state.pointsAllocated += amt;
		// loop in case there's enough for multiple levels
                while (this.state.pointsAllocated >= this.state.nextUnlock) {
                        this.state.pointsAllocated -= this.state.nextUnlock;
                        this.upgradeBuilding();
                        // Cost for the next level scales with (level + 1)
                        this.state.nextUnlock = BalanceCalculators.getBuildingCost(
                                this.spec.baseCost,
                                this.level + 1
                        );
                        // TODO - Check this is the best way compared to just multiplying based on the last unlock. This method provides balancing in future updates, but harder to work with.
                }
        }

        public getUnlockCostData() {
                return { cost: this.state.nextUnlock, spent: this.state.pointsAllocated };
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

	get allocated() {
		return this.state.pointsAllocated;
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
			pointsAllocated: this.state.pointsAllocated,
			nextUnlock: this.state.nextUnlock,
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
			pointsAllocated: 0,
			level: 0,
                        nextUnlock: BalanceCalculators.getBuildingCost(spec.baseCost, 1),
		};
		return new Building(spec, defaultState);
	}
}
