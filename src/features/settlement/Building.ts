import { BuildingSnapshot, BuildingSpec, BuildingState, BuildingUnlockStatus } from "@/shared/types";
import { bus } from "@/core/EventBus";
import { SpecRegistryBase } from "@/models/SpecRegistryBase";
import { BalanceCalculators, GAME_BALANCE } from "@/balance/GameBalance";
import { GameContext } from "@/core/GameContext";

export class Building extends SpecRegistryBase<BuildingSpec> {
	private constructor(private readonly spec: BuildingSpec, private state: BuildingState) {
		super();
		bus.on("Game:GameTick", (dt) => this.handleTick(dt));
		bus.on("game:prestige", () => this.resetEfficiency());
	}

	private handleTick(delta: number) {
		this.processEfficiency(delta);
	}

	// ─────────────────────────────────────────────────────
	// Gold Efficiency Processing
	private goldTimer = 0;
	private readonly cycleSeconds = 10;

	private processEfficiency(dt: number) {
		if (!this.state.goldAllocation || this.state.goldAllocation <= 0) return;

		this.goldTimer += dt;

		if (this.goldTimer < this.cycleSeconds) return;

		// Time to attempt to consume gold for next efficiency tick
		this.goldTimer -= this.cycleSeconds;

		const p = GameContext.getInstance().player;

		// Calculate cost: baseAllocation * 1.5^{level}
		const costMultiplier = Math.pow(1.5, this.state.goldEfficiencyLevel || 0);
		const cost = Math.ceil((this.state.goldAllocation || 0) * costMultiplier);

		if (p.spendGold(cost)) {
			this.state.goldEfficiencyLevel = (this.state.goldEfficiencyLevel || 0) + 1;
			this.state.efficiencyActive = true;
		} else {
			this.state.efficiencyActive = false;
		}
	}

	/**
	 * Allocate a base amount of gold that will be consumed every cycle.
	 * Passing 0 disables efficiency.
	 */
	public allocateGold(amount: number) {
		if (amount <= 0) {
			this.state.goldAllocation = 0;
			this.state.efficiencyActive = false;
			return;
		}
		this.state.goldAllocation = amount;
	}

	/** Reset efficiency when a prestige occurs */
	public resetEfficiency() {
		this.state.goldEfficiencyLevel = 0;
		this.state.efficiencyActive = false;
		this.state.goldAllocation = 0;
		this.goldTimer = 0;
	}

	/**
	 * Multiplier applied to building effects from gold efficiency.
	 */
	public getEfficiencyMultiplier(): number {
		return 1 + (this.state.goldEfficiencyLevel || 0) * 0.01;
	}

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
			this.state.nextUnlock = BalanceCalculators.getBuildingCost(this.spec.baseCost, this.level + 1);
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
			nextUnlock: BalanceCalculators.getBuildingCost(spec.baseCost, 0),
			goldEfficiencyLevel: 0,
			goldAllocation: 0,
			efficiencyActive: false,
		};
		return new Building(spec, defaultState);
	}
}
