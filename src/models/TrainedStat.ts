import { bus } from "@/core/EventBus";
import { StatsModifier, TrainedStatSpec, TrainedStatSpecs, TrainedStatState } from "./Stats";

const GROWTH_VALUE = 1.35;
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
	get status() {
		return this.state.status;
	}
	get baseGainRate() {
		return this.spec.baseGainRate;
	}

	/**
	 * Call on each “tick” (deltaTime in seconds).
	 * Increases progress = assignedPoints * baseGainRate * deltaTime
	 * and handles leveling up.
	 */
	public handleTick(deltaTime: number) {
		if (this.state.assignedPoints === 0) return;

		this.state.progress += this.state.assignedPoints * deltaTime;

		while (this.state.progress >= this.state.nextThreshold) {
			this.state.progress -= this.state.nextThreshold;
			this.levelUp();

			// e.g. exponential growth: increase threshold by 15% each level
			this.state.nextThreshold = Math.floor(this.state.nextThreshold * GROWTH_VALUE);
		}
	}

	public adjustAssignedPoints(delta: number) {
		this.state.assignedPoints += delta;
	}

	private levelUp() {
		this.state.level += 1;
		bus.emit("player:trainedStatChanged", this.state.id);
	}

	public getBonuses(): Partial<StatsModifier> {
		return Object.fromEntries(
			Object.entries(this.spec.statMod).map(([k, v]) => {
				return [k, v * this.level];
			})
		) as Partial<StatsModifier>;
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
