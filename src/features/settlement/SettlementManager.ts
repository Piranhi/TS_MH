import { bus } from "@/core/EventBus";
import { Building } from "./Building";
import { Saveable } from "@/shared/storage-types";
import { BuildingType, BuildingUnlockStatus } from "@/shared/types";
import { Outpost } from "../hunt/Outpost";
import { GameBase } from "@/core/GameBase";

interface SettlementSaveState {
	buildings: [BuildingType, Building][];
	buildPoints: number;
	passive: { currentReward: number; lastTimestamp: number; maxReward: number };
	// Add outpost saving
	outposts: [string, Outpost][];
	availableOutposts: string[];
}

interface SettlementRewardSnapshot {
	reward: number;
	progress: number;
	timeToNext: number;
	max: number;
	earnedPoints: number;
}

export class SettlementManager extends GameBase implements Saveable {
	// ── Passive-reward config ─────────────────────────────────────────────────
	private readonly rewardIntervalMs = 8640000; // 8640000 for 10 in a day
	private readonly rewardIncrement = 0.1; // how much each interval gives
	private currentReward: number = 0; // how many increments we've banked
	private maxReward: number = 1;
	private lastRewardTimestamp: number = Date.now(); // when we last granted (or initialized)

	// ── Other settlement state ────────────────────────────────────────────────
	private buildingsMap = new Map<BuildingType, Building>();
	private settlementBuildPoints: number = 0;
	private buildPointsPerPrestige: number = 100;

	// ── NEW: Outpost management ────────────────────────────────────────────────
	private outposts = new Map<string, Outpost>();
	private availableOutposts = new Set<string>();

	constructor() {
		super();
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

		// Listen for outpost availability from AreaManager
		bus.on("outpost:available", ({ areaId }) => {
			this.markOutpostAvailable(areaId);
		});
	}

	private Init() {
		this.seedMissingBuildings();
	}

	// ── OUTPOST METHODS ───────────────────────────────────────────────────────

	/**
	 * Mark an outpost as available to build (called by AreaManager)
	 */
	public markOutpostAvailable(areaId: string): void {
		if (!this.availableOutposts.has(areaId) && !this.outposts.has(areaId)) {
			this.availableOutposts.add(areaId);
			this.emitChange();
		}
	}

	/**
	 * Build an outpost in a specific area
	 */
	public buildOutpost(areaId: string): boolean {
		if (!this.availableOutposts.has(areaId)) {
			console.warn(`Outpost not available for area: ${areaId}`);
			return false;
		}

		// TODO: Check if player has resources to build
		// const cost = this.getOutpostCost(areaId);
		// if (!this.canAfford(cost)) return false;

		// Get outpost spec and create instance
		const outpostSpec = Outpost.getSpecByAreaId(areaId);
		if (!outpostSpec) {
			console.error(`No outpost spec found for area: ${areaId}`);
			return false;
		}

		const outpost = Outpost.create(outpostSpec);
		this.outposts.set(areaId, outpost);
		this.availableOutposts.delete(areaId);

		bus.emit("outpost:built", {
			areaId: areaId,
			outpost: outpost,
		});

		this.emitChange();
		return true;
	}

	/**
	 * Get area modifiers from an outpost (if built)
	 */
	public getAreaModifiers(areaId: string) {
		const outpost = this.outposts.get(areaId);
		if (!outpost) {
			// Return default modifiers
			return {
				killsToUnlockBoss: 10,
				enemySpawnSpeedMultiplier: 1,
				canSkipArea: false,
				dropRateMultiplier: 1,
				experienceMultiplier: 1,
			};
		}
		return outpost.getAreaModifiers();
	}

	/**
	 * Check if an outpost exists in an area
	 */
	public hasOutpost(areaId: string): boolean {
		return this.outposts.has(areaId);
	}

	/**
	 * Check if player can build an outpost in an area
	 */
	public canBuildOutpost(areaId: string): boolean {
		return this.availableOutposts.has(areaId);
	}

	/**
	 * Get all built outposts
	 */
	public getBuiltOutposts(): Outpost[] {
		return Array.from(this.outposts.values());
	}

	/**
	 * Get all available outpost locations
	 */
	public getAvailableOutpostLocations(): string[] {
		return Array.from(this.availableOutposts);
	}

	/**
	 * Upgrade an outpost
	 */
	public upgradeOutpost(areaId: string): boolean {
		const outpost = this.outposts.get(areaId);
		if (!outpost) return false;

		// TODO: Check resources
		// const cost = this.getOutpostUpgradeCost(outpost);
		// if (!this.canAfford(cost)) return false;

		const success = outpost.levelUp();
		if (success) {
			this.emitChange();
		}
		return success;
	}

	// DEBUG

	public unlockAllBuildings() {
		for (const building of this.getAllBuildings()) {
			if (building.buildingStatus === "hidden") building.buildingStatus = "unlocked";
		}
		bus.emit("settlement:changed");
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

        spendBuildPoints(type: BuildingType, amt: number) {
                const building = this.buildingsMap.get(type);
                if (!building) return;

                const spend = Math.min(amt, this.settlementBuildPoints);
                if (spend <= 0) return;

                this.settlementBuildPoints -= spend;
                building.spendPoints(spend);
                bus.emit("settlement:buildPointsChanged", this.settlementBuildPoints);
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
			// Save outpost data
			outposts: Array.from(this.outposts),
			availableOutposts: Array.from(this.availableOutposts),
		};
	}

	load(state: SettlementSaveState): void {
		this.buildingsMap = new Map(state.buildings || []);
		this.settlementBuildPoints = state.buildPoints;

		// restore saved passive state…
		this.currentReward = state.passive.currentReward;
		this.lastRewardTimestamp = state.passive.lastTimestamp;
		this.maxReward = state.passive.maxReward;

		// Load outpost data
		this.outposts = new Map(state.outposts || []);
		this.availableOutposts = new Set(state.availableOutposts || []);

		// …then immediately catch up any offline progress
		this.updatePassiveRewards();
		this.emitChange();
	}
}
