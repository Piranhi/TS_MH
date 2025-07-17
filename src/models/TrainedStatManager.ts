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
	private _maxStamina: number = 10;

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
			// Spending energy
			if (!this.context.player.spendEnergy(delta)) return;
			stat.adjustAssignedPoints(delta);
		} else {
			// Refunding energy
			const pts = Math.abs(delta);
			if (stat.assignedPoints < pts) return;
			if (!this.context.player.refundEnergy(pts)) return;
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

	get maxStamina() {
		return this._maxStamina;
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
		attack1: {
			id: "attack1",
			level: 0,
			progress: 0,
			nextThreshold: 5,
			assignedPoints: 0,
			status: "Unlocked",
		},
		attack2: {
			id: "attack2",
			level: 0,
			progress: 0,
			nextThreshold: 100,
			assignedPoints: 0,
			status: "Hidden",
		},
		defence1: {
			id: "defence1",
			level: 0,
			progress: 0,
			nextThreshold: 5,
			assignedPoints: 0,
			status: "Unlocked",
		},
		defence2: {
			id: "defence2",
			level: 0,
			progress: 0,
			nextThreshold: 100,
			assignedPoints: 0,
			status: "Hidden",
		},
	};
}

// Specs are loaded from config/data, not created at runtime
export const TrainedStatSpecs: Record<TrainedStatType, TrainedStatSpec> = {
	attack1: {
		id: "attack1",
		name: "Attack 1",
		baseMultiplier: 0.05,
		levelUpBase: 60,
		statMod: { attack: 0.1 },
	},
	attack2: {
		id: "attack2",
		name: "Attack 2",
		baseMultiplier: 0.05,
		levelUpBase: 60,
		statMod: { attack: 0.5 },
	},
	defence1: {
		id: "defence1",
		name: "Defence 1",
		baseMultiplier: 0.125,
		levelUpBase: 6000,
		statMod: { defence: 0.1 },
	},
	defence2: {
		id: "defence2",
		name: "Defence 2",
		baseMultiplier: 0.125,
		levelUpBase: 6000,
		statMod: { defence: 0.5 },
	},
};
