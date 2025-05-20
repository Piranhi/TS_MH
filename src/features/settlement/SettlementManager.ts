import { bus } from "@/core/EventBus";
import { Building } from "./Building";
import { Saveable } from "@/shared/storage-types";
import { BuildingType, BuildingUnlockStatus, STARTING_BUILDING_UNLOCKS } from "@/shared/types";

interface SettlementSaveState {
	freePlots: number;
	buildings: [BuildingType, Building][];
}

interface SettlementRewardSnapshot {
	reward: number;
	progressStart: number;
	nextUnlock: number;
	max: number;
}

export class SettlementManager implements Saveable {
	private freePlots = 1;
	private buildingsMap = new Map<BuildingType, Building>();

	private readonly TIME_BETWEEN_REWARDS: number = 20000; // 8640000 for 10 in a day
	private passiveReward: number = 1;
	private passiveProgress: number = Date.now();
	private passiveProgressStart: number = Date.now();
	private passiveNextUnlock = this.passiveProgressStart + this.TIME_BETWEEN_REWARDS;

	private maxPassiveReward: number = 2;

	constructor() {
		this.Init();
		this.changeBuildingStatus("guildHall", "unlocked");
		// When the game is ready, setup everything
		bus.on("game:gameReady", () => {
			// Setup variables for the first reward cycle:
			this.passiveProgressStart = Date.now();
			this.passiveNextUnlock = this.passiveProgressStart + this.TIME_BETWEEN_REWARDS;

			bus.on("Game:GameTick", (delta) => {
				// Only process rewards if we haven't hit max
				if (this.passiveReward < this.maxPassiveReward && Date.now() >= this.passiveNextUnlock) {
					this.increasePassiveReward();

					// If we can still earn more, start the next timer
					if (this.passiveReward < this.maxPassiveReward) {
						this.passiveProgressStart = Date.now();
						this.passiveNextUnlock = this.passiveProgressStart + this.TIME_BETWEEN_REWARDS;
					}
				}
			});
			bus.on("game:gameLoaded", () => this.Init());
			this.emitChange();
		});
		// On prestige, reset progress for a new run
		bus.on("game:prestige", () => {
			this.passiveReward = 1;
			this.passiveProgressStart = Date.now();
			this.passiveNextUnlock = this.passiveProgressStart + this.TIME_BETWEEN_REWARDS;
		});
	}

	private Init() {
		this.seedMissingBuildings();
	}
	// Fill in missing specs if we add more in future
	seedMissingBuildings(): void {
		const specs = Building.getAllSpecs();
		for (const spec of specs) {
			const key = spec.id as BuildingType;
			if (!this.buildingsMap.has(key)) {
				this.buildingsMap.set(key, Building.create(spec.id));
			}
		}
	}

	increasePassiveReward() {
		this.passiveReward = Math.min(this.passiveReward + 0.1, 2);
		const rounded = Math.round(this.passiveReward * 10) / 10;
		this.passiveReward = rounded;
		this.passiveProgress = Date.now();
		this.passiveProgressStart = Date.now();
		this.passiveNextUnlock = this.passiveProgressStart + this.TIME_BETWEEN_REWARDS;
	}

	resetPassiveReward() {
		this.passiveReward = 1;
		this.passiveProgress = Date.now();
		this.passiveProgressStart = Date.now();
		this.passiveNextUnlock = this.passiveProgressStart + this.TIME_BETWEEN_REWARDS;
	}

	getFreePlots(): number {
		return this.freePlots;
	}

	getTotalPlots(): number {
		return this.freePlots + this.buildingsMap.size;
	}

	hasFreePlots(): boolean {
		return this.freePlots > 0;
	}

	getBuilding(type: BuildingType): Building | undefined {
		return this.buildingsMap.get(type);
	}

	getAllBuildings() {
		return Array.from(this.buildingsMap.values());
	}

	rewardSnapshot(): SettlementRewardSnapshot {
		return {
			reward: this.passiveReward,
			progressStart: this.passiveProgressStart,
			nextUnlock: this.passiveNextUnlock,
			max: this.maxPassiveReward,
		};
	}

	addPlot() {
		this.freePlots++;
		this.emitChange();
	}

	buildBuilding(type: BuildingType) {
		const building = Building.create(type.toString());
		this.buildingsMap.set(type, building);
		this.emitChange();
		bus.emit("settlement:changed");
	}

	changeBuildingStatus(type: BuildingType, newStatus: BuildingUnlockStatus) {
		const building = this.buildingsMap.get(type);
		if (!building) return;
		building.buildingStatus = newStatus;
		this.buildingsMap.set(type, building);
		bus.emit("settlement:changed");
	}

	upgradeBuilding(type: BuildingType) {
		const building = this.buildingsMap.get(type);
		if (!building) return false;
		building.upgradeBuilding();
		this.emitChange();
	}

	emitChange() {
		bus.emit("settlement:changed");
	}

	save(): SettlementSaveState {
		return {
			buildings: Array.from(this.buildingsMap),
			freePlots: this.freePlots,
		};
	}

	load(state: SettlementSaveState): void {
		this.buildingsMap = new Map(state.buildings || []);
		this.freePlots = state.freePlots;
		this.emitChange();
	}
}
