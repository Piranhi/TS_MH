import { Saveable } from "@/shared/storage-types";
import { Player } from "../core/Player";
import { makeDefaultTrainedStatStates, StatsModifier, TrainedStatState } from "./Stats";
import { TrainedStat } from "./TrainedStat";
import { mergeStatModifiers } from "@/shared/utils/stat-utils";
import { Destroyable } from "./Destroyable";
import { bindEvent } from "@/shared/utils/busUtils";
import { GameContext } from "@/core/GameContext";

interface TrainedStatManagerSave {
	trainedStatStates: Record<string, TrainedStatState>;
}

export class TrainedStatManager extends Destroyable implements Saveable {
	private trainedStats: Map<string, TrainedStat> = new Map();
	private context = GameContext.getInstance();

	constructor() {
		super();
		this.initaliseStats();

		bindEvent(this.eventBindings, "game:gameReady", () => this.recalculate());
		bindEvent(this.eventBindings, "player:trainedStatChanged", () => this.recalculate());
		bindEvent(this.eventBindings, "Game:GameTick", (dt) => this.tickStats(dt));
	}

	private initaliseStats() {
		const defaultStates = makeDefaultTrainedStatStates();
		for (const [id, state] of Object.entries(defaultStates)) {
			this.trainedStats.set(id, new TrainedStat(state));
		}
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
			const pts = Math.abs(delta);
			if (stat.assignedPoints < pts) return; // can't refund more than there
			if (!Player.getInstance().refundStamina(pts)) return; // should always succeed
			stat.adjustAssignedPoints(delta);
		}
	}

	private tickStats(dt: number) {
		for (const stat of this.trainedStats.values()) {
			stat.handleTick(dt);
		}
	}

	private recalculate() {
		const merged = [...this.trainedStats.values()].map((stat) => stat.getBonuses()).reduce(mergeStatModifiers, {} as StatsModifier);

		this.context.character.statsEngine.setLayer("trainedStats", () => merged);
	}

	get stats() {
		return this.trainedStats;
	}

	save(): TrainedStatManagerSave {
		const trainedStatStates: Record<string, TrainedStatState> = {};
		for (const [id, stat] of this.trainedStats.entries()) {
			trainedStatStates[id] = stat.getState();
		}
		return { trainedStatStates };
	}

	load(saveData: TrainedStatManagerSave): void {
		this.trainedStats.clear();

		// Load from save data, falling back to defaults for missing stats
		const defaultStates = makeDefaultTrainedStatStates();
		const statesToLoad = { ...defaultStates, ...saveData.trainedStatStates };

		for (const [id, state] of Object.entries(statesToLoad)) {
			this.trainedStats.set(id, new TrainedStat(state));
		}

		this.recalculate();
	}
}
