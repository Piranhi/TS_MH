import { Saveable } from "@/shared/storage-types";
import { Player } from "./player";
import { makeDefaultTrainedStats, StatsModifier } from "./Stats";
import { TrainedStat } from "./TrainedStat";
import { mergeStatModifiers } from "@/shared/utils/stat-utils";
import { bus } from "@/core/EventBus";

interface TrainedStatManagerSave {
	trainedStats: [string, TrainedStat][];
}

export class TrainedStatManager implements Saveable {
	private trainedStats: Map<string, TrainedStat> = new Map();

	constructor() {
		this.trainedStats = new Map(Object.entries(makeDefaultTrainedStats()));
		bus.on("game:gameReady", () => this.recalculate());
		bus.on("player:trainedStatChanged", () => this.recalculate());
	}

	public allocateTrainedStat(id: string, rawDelta: number): void {
		const stat = this.trainedStats.get(id);
		if (!stat) return;

		//Only whole point changes
		const delta = Math.trunc(rawDelta);
		if (delta === 0) return;

		if (delta > 0) {
			// spending
			if (!Player.getInstance().spendStamina(delta)) return;
			stat.adjustAssignedPoints(delta);
		} else {
			// refunding
			const pts = delta * -1;
			if (stat.assignedPoints < pts) return; // can't refund more than there
			if (!Player.getInstance().refundStamina(pts)) return; // should always succeed
			stat.adjustAssignedPoints(delta);
		}
	}

	private recalculate() {
		this.clearBonuses();
		const merged = [...this.trainedStats.values()].map((stat) => stat.getBonuses()).reduce(mergeStatModifiers, {} as StatsModifier);
		Player.getInstance()
			.getPlayerCharacter()
			.statsEngine.setLayer("trainedStats", () => merged);
		console.log(merged);
	}

	clearBonuses() {}

	get stats() {
		return this.trainedStats;
	}

	save(): TrainedStatManagerSave {
		return {
			trainedStats: Array.from(this.trainedStats.entries()),
		};
	}

	load(state: TrainedStatManagerSave): void {
		this.trainedStats = new Map(state.trainedStats);
	}
}
