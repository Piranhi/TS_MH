import { bus } from "@/core/EventBus";
import { PlayerStats, StatsModifier, TrainedStatData, TrainedStatStatus, TrainedStatType } from "./Stats";
import { Player } from "./player";
import { BigNumber } from "./utils/BigNumber";

const GROWTH_VALUE = 1.35;
export class TrainedStat {
	id: TrainedStatType;
	name: string;
	level: number;
	progress: number;
	nextThreshold: number;
	private _assignedPoints: number;
	baseGainRate: number;
	status: TrainedStatStatus;
	statMod: Partial<StatsModifier>;

	constructor(data: TrainedStatData) {
		this.id = data.id;
		this.name = data.name;
		this.level = data.level;
		this.progress = data.progress;
		this.nextThreshold = data.nextThreshold;
		this._assignedPoints = 0;
		this.baseGainRate = data.baseGainRate;
		this.status = data.status;
		this.statMod = data.statMod;

		bus.on("Game:GameTick", (dt) => this.update(dt));
	}

	/**
	 * Call on each “tick” (deltaTime in seconds).
	 * Increases progress = assignedPoints * baseGainRate * deltaTime
	 * and handles leveling up.
	 */
	public update(deltaTime: number) {
		if (this._assignedPoints === 0) return;

		this.progress += this._assignedPoints * this.baseGainRate * deltaTime;

		while (this.progress >= this.nextThreshold) {
			this.progress -= this.nextThreshold;
			this.levelUp();

			// e.g. exponential growth: increase threshold by 15% each level
			this.nextThreshold = Math.floor(this.nextThreshold * GROWTH_VALUE);
		}
	}

	public adjustAssignedPoints(delta: number) {
		this._assignedPoints += delta;
	}

	private levelUp() {
		this.level += 1;
		bus.emit("player:trainedStatChanged", this.id);
	}

	get assignedPoints() {
		return this._assignedPoints;
	}

	public getBonuses() {
		return Object.fromEntries(
			Object.entries(this.statMod).map(([k, v]) => {
				if (typeof v === "number") {
					return [k, v * this.level];
				} else if (v instanceof BigNumber) {
					// Multiply by number or another BigNumber as appropriate
					return [k, v.multiply(this.level)];
				}
				return [k, v];
			})
		) as Partial<StatsModifier>;
	}

	toJSON() {
		return {
			__type: "TrainedStat", // for your reviver
			id: this.id,
			name: this.name,
			level: this.level,
			progress: this.progress,
			nextThreshold: this.nextThreshold,
			assignedPoints: this._assignedPoints,
			baseGainRate: this.baseGainRate,
			status: this.status,
			statMod: this.statMod,
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
			statMod: raw.statMod,
		};
		const stat = new TrainedStat(dummy);
		// overwrite anything the constructor didn’t set
		stat._assignedPoints = raw.assignedPoints;
		return stat;
	}
}
