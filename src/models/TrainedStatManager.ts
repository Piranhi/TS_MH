// ===================================================
// Updated TrainedStatManager.ts
// ===================================================
import { Saveable } from "@/shared/storage-types";
import { StatsModifier, TrainedStatSpec, TrainedStatState, TrainedStatType } from "./Stats";
import { TrainedStat } from "./TrainedStat";
import { mergeStatModifiers } from "@/shared/utils/stat-utils";
import { Destroyable } from "../core/Destroyable";
import { bindEvent } from "@/shared/utils/busUtils";
import { GameContext } from "@/core/GameContext";
import { OfflineProgressHandler } from "./OfflineProgress";

interface TrainedStatManagerSave {
	trainedStatStates: Record<string, TrainedStatState>;
}

export class TrainedStatManager extends Destroyable implements Saveable, OfflineProgressHandler {
	private trainedStats: Map<string, TrainedStat> = new Map();
	private context: GameContext;

	constructor() {
		super();
		this.context = GameContext.getInstance();
		this.initializeStats();

		bindEvent(this.eventBindings, "game:gameReady", () => this.recalculate());
		bindEvent(this.eventBindings, "player:trainedStatChanged", () => this.recalculate());
		bindEvent(this.eventBindings, "Game:GameTick", (dt) => this.handleTick(dt));
	}

	handleOfflineProgress(offlineSeconds: number): null {
		this.handleTick(offlineSeconds);
		return null;
	}

	private initializeStats() {
		const defaultStates = makeDefaultTrainedStatStates();
		for (const [id, state] of Object.entries(defaultStates)) {
			this.trainedStats.set(id, new TrainedStat(state));
		}
	}

	public allocateTrainedStat(id: string, rawDelta: number): void {
		const stat = this.trainedStats.get(id);
		if (!stat) return;

		const delta = Math.trunc(rawDelta);
		if (delta === 0) return;

		if (delta > 0) {
			// Spending stamina
			if (!this.context.player.spendStamina(delta)) return;
			stat.adjustAssignedPoints(delta);
		} else {
			// Refunding stamina
			const pts = Math.abs(delta);
			if (stat.assignedPoints < pts) return;
			if (!this.context.player.refundStamina(pts)) return;
			stat.adjustAssignedPoints(delta);
		}
	}

	private handleTick(dt: number) {
		if (this.context.isOfflinePaused) return;
		for (const stat of this.trainedStats.values()) {
			stat.handleTick(dt);
		}
	}

	private recalculate() {
		const merged = [...this.trainedStats.values()].map((stat) => stat.getBonuses()).reduce(mergeStatModifiers, {} as StatsModifier);

		// Apply to character if we have an active run
		if (this.context.currentRun) {
			this.context.character.statsEngine.setLayer("trainedStats", () => merged);
		}
	}

	public onLevelUp(newLevel: number) {
		// Handle any level-up specific logic for trained stats
		// Maybe unlock new stats at certain levels?
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

		const defaultStates = makeDefaultTrainedStatStates();
		const statesToLoad = { ...defaultStates, ...saveData.trainedStatStates };

		for (const [id, state] of Object.entries(statesToLoad)) {
			this.trainedStats.set(id, new TrainedStat(state));
		}

		this.recalculate();
	}
}

function makeDefaultTrainedStatStates(): Record<TrainedStatType, TrainedStatState> {
	return {
		power: {
			id: "power",
			level: 1,
			progress: 0,
			//nextThreshold: 10,
			assignedPoints: 0,
			status: "Unlocked",
		},
		guard: {
			id: "guard",
			level: 1,
			progress: 0,
			//nextThreshold: 10,
			assignedPoints: 0,
			status: "Unlocked",
		},
		power2: {
			id: "power2",
			level: 1,
			progress: 0,
			//nextThreshold: 1000,
			assignedPoints: 0,
			status: "Unlocked",
		},
		guard2: {
			id: "guard2",
			level: 1,
			progress: 0,
			//nextThreshold: 1000,
			assignedPoints: 0,
			status: "Unlocked",
		},
		crit: {
			id: "crit",
			level: 1,
			progress: 0,
			//nextThreshold: 100,
			assignedPoints: 0,
			status: "Hidden",
		},
	};
}

// Specs are loaded from config/data, not created at runtime
export const TrainedStatSpecs: Record<TrainedStatType, TrainedStatSpec> = {
	power: {
		id: "power",
		name: "Power",
		baseMultiplier: 0.05,
		maxAssigned: 60,
		statMod: { power: 1 },
	},
	guard: {
		id: "guard",
		name: "Guard",
		baseMultiplier: 0.05,
		maxAssigned: 60,
		statMod: { guard: 1 },
	},
	power2: {
		id: "power2",
		name: "Advanced Power",
		baseMultiplier: 0.125,
		maxAssigned: 6000,
		statMod: { guard: 1 },
	},
	guard2: {
		id: "guard2",
		name: "Advanced Guard",
		baseMultiplier: 0.125,
		maxAssigned: 6000,
		statMod: { guard: 1 },
	},
	crit: {
		id: "crit",
		name: "Crit",
		baseMultiplier: 0.125,
		maxAssigned: 600,
		statMod: { critDamage: 1 },
	},
};
