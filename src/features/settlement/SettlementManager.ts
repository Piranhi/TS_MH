import { bus } from "@/core/EventBus";
import { Building } from "./Building";
import { Saveable } from "@/shared/storage-types";
import { BuildingType, BuildingUnlockStatus } from "@/shared/types";

interface SettlementSaveState {
	buildings: [BuildingType, Building][];
	buildPoints: number;
	passive: { currentReward: number; lastTimestamp: number; maxReward: number };
}

interface SettlementRewardSnapshot {
	reward: number;
	progress: number;
	timeToNext: number;
	max: number;
	earnedPoints: number;
}

export class SettlementManager implements Saveable {
	// ── Passive-reward config ─────────────────────────────────────────────────
	private readonly rewardIntervalMs = 4000; // 8640000 for 10 in a day
	private readonly rewardIncrement = 0.1; // how much each interval gives
	private currentReward: number = 0; // how many increments we’ve banked
	private maxReward: number = 1;
	private lastRewardTimestamp: number = Date.now(); // when we last granted (or initialized)

	// ── Other settlement state ────────────────────────────────────────────────
	private buildingsMap = new Map<BuildingType, Building>();
	private settlementBuildPoints: number = 0;

	private buildPointsPerPrestige: number = 100;

	constructor() {
		// When the game is ready, setup everything
		bus.on("game:gameReady", () => {
			// Setup variables for the first reward cycle:
			this.Init();
			this.changeBuildingStatus("guild_hall", "construction");
			bus.on("Game:GameTick", (delta) => {
				this.updatePassiveRewards();
			});
			this.emitChange();
		});

		// On prestige, reset progress for a new run
		bus.on("game:prestige", () => {
			this.resetPassiveReward();
		});

		bus.on("game:gameLoaded", () => {
			this.Init();
			this.updatePassiveRewards();
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

	/**
	 * Core passive-reward updater.
	 * Computes how many full intervals have passed since lastRewardTimestamp,
	 * awards them (capped at maxReward), and advances lastRewardTimestamp
	 * by the amount of time actually consumed.
	 */

	private updatePassiveRewards() {
		// Only process rewards if we haven't hit max
		if (this.currentReward >= this.maxReward) return;
		const now = Date.now();

		const elapsed = now - this.lastRewardTimestamp;
		const intervals = Math.floor(elapsed / this.rewardIntervalMs);
		if (intervals <= 0) return;

		// award the intervals (each gives rewardIncrement), capped at maxReward
		this.currentReward = Math.min(this.currentReward + intervals * this.rewardIncrement, this.maxReward);

		// consume only the time we actually used
		this.lastRewardTimestamp += intervals * this.rewardIntervalMs;

		// tell UI/other systems that passive has advanced
		bus.emit("settlement:changed");
	}

	resetPassiveReward() {
		this.currentReward = 0;
		this.lastRewardTimestamp = Date.now();
		bus.emit("settlement:changed");
	}

	spendUnlockPoints(type: BuildingType, amt: number) {
		const building = this.buildingsMap.get(type);
		if (!building) return;
		building.spendPoints(10);
		bus.emit("settlement:changed");
	}

	// GETTERS AND SETTERS

	getBuilding(type: BuildingType): Building | undefined {
		return this.buildingsMap.get(type);
	}

	getAllBuildings() {
		return Array.from(this.buildingsMap.values());
	}

	get passiveCurrent(): number {
		return this.currentReward;
	}

	get passiveMax(): number {
		return this.maxReward;
	}

	get totalBuildPoints(): number {
		return this.settlementBuildPoints;
	}

	getBuildPointsFromPrestige(): number {
		return Math.floor((this.passiveCurrent / this.passiveMax) * this.buildPointsPerPrestige);
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

	buildBuilding(type: BuildingType) {
		const building = Building.create(type.toString());
		this.buildingsMap.set(type, building);
		this.emitChange();
		bus.emit("settlement:changed");
	}

	changeBuildingStatus(type: BuildingType, newStatus: BuildingUnlockStatus) {
		const building = this.buildingsMap.get(type);
		if (!building) {
			console.warn(`Building ${type} not found when trying to set building status`);
			return;
		}
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

	getPassiveSnapshot(): SettlementRewardSnapshot {
		const now = Date.now();
		const timeSinceLast = now - this.lastRewardTimestamp;
		return {
			reward: this.currentReward,
			progress: Math.min(timeSinceLast / this.rewardIntervalMs, 1),
			timeToNext: Math.max(this.rewardIntervalMs - timeSinceLast, 0),
			max: this.maxReward,
			earnedPoints: this.getBuildPointsFromPrestige(),
		};
	}

	emitChange() {
		bus.emit("settlement:changed");
	}

	save(): SettlementSaveState {
		return {
			buildings: Array.from(this.buildingsMap),
			buildPoints: this.settlementBuildPoints,
			passive: {
				currentReward: this.currentReward,
				lastTimestamp: this.lastRewardTimestamp,
				maxReward: this.maxReward,
			},
		};
	}

	load(state: SettlementSaveState): void {
		this.buildingsMap = new Map(state.buildings || []);
		this.settlementBuildPoints = state.buildPoints;

		// restore saved passive state…
		this.currentReward = state.passive.currentReward;
		this.lastRewardTimestamp = state.passive.lastTimestamp;
		this.maxReward = state.passive.maxReward;

		// …then immediately catch up any offline progress
		this.updatePassiveRewards();
		this.emitChange();
	}
}
