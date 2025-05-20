import { bus } from "@/core/EventBus";
import { Building } from "./Building";
import { Saveable } from "@/shared/storage-types";
import { BuildingType, BuildingUnlockStatus, STARTING_BUILDING_UNLOCKS } from "@/shared/types";

interface SettlementSaveState {
	buildings: [BuildingType, Building][];
	buildPoints: number;
	passive: { rewardCurr: number; progressStart: number; nextUnlock: number; max: number };
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

	private readonly TIME_BETWEEN_REWARDS: number = 4000; // 8640000 for 10 in a day
	private readonly BASE_BUILD_POINTS_PER_PRESTIGE: number = 100;

	private passiveRewardCurr: number = 0;
	private passiveRewardMax: number = 1;
	private passiveProgress: number = Date.now();
	private passiveProgressStart: number = Date.now();
	private passiveNextUnlock = this.passiveProgressStart + this.TIME_BETWEEN_REWARDS;

	private settlementBuildPoints: number = 0;

	constructor() {
		// When the game is ready, setup everything
		bus.on("game:gameReady", () => {
			// Setup variables for the first reward cycle:
			this.Init();
			this.changeBuildingStatus("guild_hall", "construction");
			this.passiveProgressStart = Date.now();
			this.passiveNextUnlock = this.passiveProgressStart + this.TIME_BETWEEN_REWARDS;

			bus.on("Game:GameTick", (delta) => {
				// Only process rewards if we haven't hit max
				if (this.passiveRewardCurr < this.passiveRewardMax && Date.now() >= this.passiveNextUnlock) {
					this.increasePassiveReward();

					// If we can still earn more, start the next timer
					if (this.passiveRewardCurr < this.passiveRewardMax) {
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
			this.resetPassiveReward();
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

	spendUnlockPoints(type: BuildingType, amt: number) {
		const building = this.buildingsMap.get(type);
		if (!building) return;
		building.spendPoints(10);
		bus.emit("settlement:changed");
	}

	increasePassiveReward() {
		this.passiveRewardCurr = Math.min(this.passiveRewardCurr + 0.1, this.passiveRewardMax);
		const rounded = Math.round(this.passiveRewardCurr * 10) / 10;
		this.passiveRewardCurr = rounded;
		this.passiveProgress = Date.now();
		this.passiveProgressStart = Date.now();
		this.passiveNextUnlock = this.passiveProgressStart + this.TIME_BETWEEN_REWARDS;
	}

	resetPassiveReward() {
		this.passiveRewardCurr = 0;
		this.passiveProgress = Date.now();
		this.passiveProgressStart = Date.now();
		this.passiveNextUnlock = this.passiveProgressStart + this.TIME_BETWEEN_REWARDS;
	}

	getFreePlots(): number {
		return this.freePlots;
	}

	get passiveCurrent(): number {
		return this.passiveRewardCurr;
	}

	get passiveMax(): number {
		return this.passiveRewardMax;
	}

	get totalBuildPoints(): number {
		return this.settlementBuildPoints;
	}

	getBuildPointsFromPrestige(): number {
		return Math.floor((this.passiveCurrent / this.passiveMax) * this.BASE_BUILD_POINTS_PER_PRESTIGE);
	}

	modifyBuildPoints(amt: number): boolean {
		if (this.settlementBuildPoints + amt < 0) return false;
		this.settlementBuildPoints += amt;

		bus.emit("settlement:buildPointsChanged", this.settlementBuildPoints);
		return true;
	}

	setBuildPoints(amt: number) {
		// Used on load
		this.settlementBuildPoints = amt;
		bus.emit("settlement:buildPointsChanged", this.settlementBuildPoints);
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
			reward: this.passiveRewardCurr,
			progressStart: this.passiveProgressStart,
			nextUnlock: this.passiveNextUnlock,
			max: this.passiveRewardMax,
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
		console.log(building);
		if (!building) {
			console.warn(`Building ${type} not found when trying to set building status`);
			return;
		}
		building.buildingStatus = newStatus;
		console.log(building.buildingStatus);
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
			buildPoints: this.settlementBuildPoints,
			passive: {
				rewardCurr: this.passiveRewardCurr,
				progressStart: this.passiveProgressStart,
				nextUnlock: this.passiveNextUnlock,
				max: this.passiveRewardMax,
			},
		};
	}

	load(state: SettlementSaveState): void {
		this.buildingsMap = new Map(state.buildings || []);
		this.settlementBuildPoints = state.buildPoints;

		this.passiveRewardCurr = state.passive.rewardCurr;
		this.passiveProgressStart = Date.now();
		this.passiveNextUnlock = state.passive.nextUnlock;
		this.passiveRewardMax = state.passive.max;
		this.emitChange();
	}
}
