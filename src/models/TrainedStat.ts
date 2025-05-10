export type TrainedStatStatus = "Unlocked" | "Locked" | "Hidden"

export interface TrainedStatData {
	id: string;
	name: string;
	level: number;
	progress: number;
	nextThreshold: number;
	assignedPoints: number;
	baseGainRate: number;
    status: TrainedStatStatus
}

const GROWTH_VALUE = 1.35;
export class TrainedStat {
	id: string;
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
		this.assignedPoints = data.assignedPoints;
		this.baseGainRate = data.baseGainRate;
        this.status = data.status;
	}

	/**
	 * Call on each “tick” (deltaTime in seconds).
	 * Increases progress = assignedPoints * baseGainRate * deltaTime
	 * and handles leveling up.
	 */
	public update(deltaTime: number) {
		this.progress += this.assignedPoints * this.baseGainRate * deltaTime;

		while (this.progress >= this.nextThreshold) {
			
			this.progress -= this.nextThreshold;
			this.level += 1;

			// e.g. exponential growth: increase threshold by 15% each level
			this.nextThreshold = Math.floor(this.nextThreshold * GROWTH_VALUE);
		}
	}

	public adjustAssignedPoints(delta: number){
		
	}
}
