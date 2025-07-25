import { bus } from "@/core/EventBus";
import { Saveable } from "@/shared/storage-types";
import { GameContext } from "@/core/GameContext";
import { Destroyable } from "@/core/Destroyable";
import { bindEvent } from "@/shared/utils/busUtils";

interface MineSaveState {
	timers: number[];
}

export class MineManager extends Destroyable implements Saveable<MineSaveState> {
	private timers: number[] = [];
	private readonly durations = [2 * 3600, 4 * 3600, 8 * 3600, 12 * 3600, 18 * 3600, 24 * 3600];

	constructor() {
		super();
		const initialShafts = GameContext.getInstance().settlement.getBuilding("mine")?.level || 0;
		this.setupTickingFeature("feature.mine", () => {
			this.timers = Array(initialShafts).fill(0);
			this.setupEventBindings();
		});
	}

	protected handleTick(dt: number) {
		if (!this.isFeatureActive()) return;
		for (let i = 0; i < this.timers.length; i++) {
			if (this.timers[i] < this.durations[i]) {
				this.timers[i] += dt;
			}
		}
	}
	private setupEventBindings() {
		bindEvent(this.eventBindings, "settlement:changed", () => this.checkForNewShafts());
	}

	private checkForNewShafts() {
		const context = GameContext.getInstance();
		const building = context.settlement.getBuilding("mine");
		const level = building ? building.level : 0;
		while (this.timers.length < level && this.timers.length < this.durations.length) {
			this.timers.push(0);
		}
	}

	getDuration(index: number): number {
		return this.durations[index] || this.durations[this.durations.length - 1];
	}

	getTimer(index: number): number {
		return this.timers[index] ?? 0;
	}

	isReady(index: number): boolean {
		return this.timers[index] >= this.getDuration(index);
	}

	openShaft(index: number): Record<string, number> {
		if (!this.isReady(index)) return {};
		this.timers[index] = 0;
		const tier = index + 1;
		const rewards: Record<string, number> = {
			raw_ore: tier * 5,
			gold: tier * 10,
		};
		const resources = GameContext.getInstance().resources;
		for (const [id, qty] of Object.entries(rewards)) {
			resources.addResource(id, qty);
		}
		bus.emit("mine:opened", { index, rewards });
		return rewards;
	}

	addShaft() {
		if (this.timers.length < this.durations.length) {
			this.timers.push(0);
		}
	}

	// Save/Load
	save(): MineSaveState {
		return { timers: this.timers };
	}

	load(state: MineSaveState): void {
		this.timers = state.timers || [];
		this.checkForNewShafts();
	}
}
