import { bus } from "@/core/EventBus";
import { TrainedStatData, TrainedStatStatus, TrainedStatType } from "./Stats";

const GROWTH_VALUE = 1.35;
export class TrainedStat {
	id: TrainedStatType;
	name: string;
	level: number;
	progress: number;
	nextThreshold: number;
	assignedPoints: number;
	baseGainRate: number;
	status: TrainedStatStatus;

	constructor(data: TrainedStatData) {
		this.id = data.id;
		this.name = data.name;
		this.level = data.level;
		this.progress = data.progress;
		this.nextThreshold = data.nextThreshold;
		this.assignedPoints = 0;
		this.baseGainRate = data.baseGainRate;
		this.status = data.status;
		bus.on("Game:GameTick", (dt) => this.update(dt));
	}

	/**
	 * Call on each “tick” (deltaTime in seconds).
	 * Increases progress = assignedPoints * baseGainRate * deltaTime
	 * and handles leveling up.
	 */
	public update(deltaTime: number) {
		if (this.assignedPoints === 0) return;
		
		this.progress += this.assignedPoints * this.baseGainRate * deltaTime;

		while (this.progress >= this.nextThreshold) {
			this.progress -= this.nextThreshold;
			this.level += 1;

			// e.g. exponential growth: increase threshold by 15% each level
			this.nextThreshold = Math.floor(this.nextThreshold * GROWTH_VALUE);
		}
	}

	public adjustAssignedPoints(delta: number) {}

	toJSON() {
		return {
			__type: "TrainedStat", // for your reviver
			id: this.id,
			name: this.name,
			level: this.level,
			progress: this.progress,
			nextThreshold: this.nextThreshold,
			assignedPoints: this.assignedPoints,
			baseGainRate: this.baseGainRate,
			status: this.status,
		};
	}

	static fromJSON(raw: any): TrainedStat {
		// Create with the minimal shape (you might have a dedicated
		// constructor or helper that takes the full state)
		const dummy: TrainedStatData = {
			id: raw.id,
			name: raw.name,
			level: raw.level,
			progress: raw.progress,
			nextThreshold: raw.nextThreshold,
			assignedPoints: raw.assignedPoints,
			baseGainRate: raw.baseGainRate,
			status: raw.status,
		};
		const stat = new TrainedStat(dummy);
		// overwrite anything the constructor didn’t set
		stat.assignedPoints = raw.assignedPoints;
		return stat;
	}
}
