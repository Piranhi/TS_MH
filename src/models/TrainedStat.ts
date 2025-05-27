import { bus } from "@/core/EventBus";
import { MAX_BARS_PER_SECOND, StatsModifier, TrainedStatSpec, TrainedStatState } from "./Stats";
import { TrainedStatSpecs } from "./TrainedStatManager";

// Remove the old constant - we don't need it anymore

export class TrainedStat {
	private state: TrainedStatState;
	private readonly spec: TrainedStatSpec;

	constructor(state: TrainedStatState) {
		this.state = { ...state }; // Copy to avoid mutation

		this.spec = TrainedStatSpecs[state.id];
		if (!this.spec) {
			throw new Error(`No spec found for trained stat: ${state.id}`);
		}
	}

	// Getters for accessing state
	get id() {
		return this.state.id;
	}
	get name() {
		return this.spec.name;
	}
	get level() {
		return this.state.level;
	}
	get progress() {
		return this.state.progress;
	}

	get assignedPoints() {
		return this.state.assignedPoints;
	}
	get maxAssignedPoints() {
		return this.spec.maxAssigned * MAX_BARS_PER_SECOND; // 60 * 10 = 600
	}
	get availablePoints() {
		return this.maxAssignedPoints - this.state.assignedPoints;
	}
	get status() {
		return this.state.status;
	}
	get baseGainRate() {
		return this.spec.baseGainRate;
	}

	/**
	 * Calculate the diminishing effect multiplier based on current level.
	 * Formula: 0.05 * (8L + 1)^0.5 where L is the number of levels completed
	 */
	private getDiminishingMultiplier(): number {
		return 0.05 * Math.pow(8 * this.state.level + 1, 0.5);
	}

	/**
	 * Call on each "tick" (deltaTime in seconds).
	 * Levels up at constant rate - no diminishing returns on XP gain.
	 */
	public handleTick(deltaTime: number) {
		if (this.state.assignedPoints === 0) return;

		// Constant leveling speed - no diminishing returns here
		this.state.progress += this.state.assignedPoints * this.spec.baseGainRate * deltaTime;

		// Level threshold is just the base maxAssigned (60), not the total possible allocation
		while (this.state.progress >= this.spec.maxAssigned) {
			this.state.progress -= this.spec.maxAssigned;
			this.levelUp();
			// Note: We no longer increase the threshold - it stays constant
		}
	}

	public adjustAssignedPoints(delta: number): boolean {
		const newTotal = this.state.assignedPoints + delta;

		// Check if we're within the allowed range (0 to maxAssigned * MAX_BARS_PER_SECOND)
		if (newTotal < 0 || newTotal > this.maxAssignedPoints) {
			return false; // Invalid adjustment
		}

		this.state.assignedPoints = newTotal;
		return true; // Successful adjustment
	}

	private levelUp() {
		this.state.level += 1;
		bus.emit("player:trainedStatChanged", this.state.id);
	}

	public getBonuses(): Partial<StatsModifier> {
		const diminishingMultiplier = this.getDiminishingMultiplier();
		return Object.fromEntries(
			Object.entries(this.spec.statMod).map(([k, v]) => {
				// Apply diminishing returns to the actual stat bonus
				return [k, v * this.level * diminishingMultiplier];
			})
		) as Partial<StatsModifier>;
	}

	/**
	 * Get the current effective gain rate (for UI display)
	 * Leveling happens at constant speed, no diminishing returns
	 */
	public getEffectiveGainRate(): number {
		return this.spec.baseGainRate;
	}

	/**
	 * Get the current diminishing multiplier (for UI display)
	 */
	public getDiminishingFactor(): number {
		return this.getDiminishingMultiplier();
	}

	/**
	 * Get the theoretical stamina needed for maximum efficiency (10 bars/second)
	 * This helps players understand when they need to move to higher tier stats
	 */
	public getTheoreticalOptimalAllocation(): number {
		return this.spec.maxAssigned * MAX_BARS_PER_SECOND;
	}

	/**
	 * Get current efficiency as percentage of maximum possible (10 bars/second)
	 */
	public getCurrentEfficiencyPercentage(): number {
		if (this.state.assignedPoints === 0) return 0;
		const barsPerSecond = this.state.assignedPoints / this.spec.maxAssigned;
		return Math.min((barsPerSecond / MAX_BARS_PER_SECOND) * 100, 100);
	}

	/**
	 * Get current bars per second rate
	 */
	public getBarsPerSecond(): number {
		if (this.state.assignedPoints === 0) return 0;
		return this.state.assignedPoints / this.spec.maxAssigned;
	}

	/**
	 * Get the level threshold (points needed to gain one level)
	 */
	public getLevelThreshold(): number {
		return this.spec.maxAssigned;
	}

	getState(): TrainedStatState {
		return { ...this.state };
	}

	toJSON() {
		return this.getState();
	}

	static fromJSON(state: TrainedStatState): TrainedStat {
		return new TrainedStat(state);
	}
}
