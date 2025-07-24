import { bus } from "@/core/EventBus";
import { StatsModifier, TrainedStatSpec, TrainedStatState } from "./Stats";
import { TrainedStatSpecs } from "./TrainedStatManager";
import { GAME_BALANCE } from "@/balance/GameBalance";

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

	get nextThreshold() {
		return this.state.nextThreshold;
	}

	get assignedPoints() {
		return this.state.assignedPoints;
	}
	get maxAssignedPoints() {
		return 1;
	}
	get availablePoints() {
		return Infinity;
	}
	get status() {
		return this.state.status;
	}

	/**
	 * Call on each "tick" (deltaTime in seconds).
	 */
	public handleTick(deltaTime: number, vigourMultiplier: number = 1) {
		if (this.state.assignedPoints === 0) return;

		// Progress is now influenced by vigour multiplier
		this.state.progress += this.state.assignedPoints * deltaTime * vigourMultiplier;

		let levelledUp = false;
		while (this.state.progress >= this.getLevelThreshold()) {
			this.state.progress -= this.getLevelThreshold();
			this.levelUp();
			levelledUp = true;
		}
		if (levelledUp) bus.emit("player:trainedStatChanged", this.state.id);
	}

	public adjustAssignedPoints(delta: number): boolean {
		const newTotal = this.state.assignedPoints + delta;
		if (newTotal < 0 || newTotal > 1) {
			return false;
		}
		this.state.assignedPoints = newTotal;
		return true;
	}

	private levelUp() {
		this.state.level += 1;
	}

	public getBonuses(): Partial<StatsModifier> {
		return Object.fromEntries(
			Object.entries(this.spec.statMod).map(([k, v]) => {
				// Apply diminishing returns to the actual stat bonus
				return [k, v * this.level];
			})
		) as Partial<StatsModifier>;
	}

	/**
	 * Get the level threshold (points needed to gain one level)
	 */
	public getLevelThreshold(): number {
		return Math.floor(this.spec.levelUpBase * Math.pow(GAME_BALANCE.training.levelUpCostMultiplier, this.state.level));
	}

	/**
	 * Calculate time to next level based on vigour multiplier and current assignment
	 */
	public getTimeToNextLevel(vigourMultiplier: number = 1): number | null {
		if (this.state.assignedPoints === 0) return null;

		const remaining = this.getLevelThreshold() - this.state.progress;
		const progressPerSecond = this.state.assignedPoints * vigourMultiplier;

		return remaining / progressPerSecond;
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
