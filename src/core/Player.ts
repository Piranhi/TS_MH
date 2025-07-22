import { bus } from "../core/EventBus";
import { Saveable } from "@/shared/storage-types";
import { printLog } from "@/core/DebugManager";
import { bindEvent } from "@/shared/utils/busUtils";
import { PrestigeState } from "@/shared/stats-types";
import { StatsModifier, BloodlineStats, defaultBloodlineStats } from "@/models/Stats";
import { BalanceCalculators } from "@/balance/GameBalance";
import { GameBase } from "./GameBase";

interface PlayerSaveState {
	level: number;
	renown: number;
	gold: number;
	energyCurrent: number;
	energyMax: number;
	experience: number;
	bloodlineStats: BloodlineStats;
	prestigeState: PrestigeState;
}

const DEFAULT_PRESTIGE_STATE: PrestigeState = {
	runsCompleted: 0,
	totalMetaPoints: 0,
	permanentAttack: 0,
	permanentDefence: 0,
	permanentHP: 0,
};

/**
 * Player represents persistent player data that survives prestige.
 * All transient/run-specific data lives in GameRun instead.
 */
export class Player extends GameBase implements Saveable {
	private static _instance: Player | null = null;

	// Persistent player stats
	private level: number = 1;
	private renown = 0;
	private gold = 0;
	private experience: number = 0;
	private energyCurrent: number = 5;
	private energyMax: number = 5;
	private bloodlineStats: BloodlineStats;
	private prestigeState: PrestigeState;

	/** Rolling window of gold gains for income estimation */
	private goldIncomeWindow: Array<{ amount: number; time: number }> = [];

	private constructor() {
		super();
		//this.energy = new RegenPool(5, 0, true, true); // Start with max energy, no regeneration
		this.energyCurrent = this.energyMax;

		this.bloodlineStats = { ...defaultBloodlineStats };
		this.prestigeState = { ...DEFAULT_PRESTIGE_STATE };

		this.setupEventBindings();
	}

	private setupEventBindings() {
		bindEvent(this.eventBindings, "game:newGame", () => this.handleNewGame());
		bindEvent(this.eventBindings, "game:gameReady", () => this.handleGameReady());
		bindEvent(this.eventBindings, "game:prestigePrep", () => this.handlePrestigePrep());
	}

	private async handleNewGame() {}

	private handleGameReady() {
		// Removed energy regeneration - stamina is now instant
		bindEvent(this.eventBindings, "Game:GameTick", () => this.calculateGoldIncome());
		bindEvent(this.eventBindings, "renown:award", (amt) => this.adjustRenown(amt));
		bus.emit("player:initialized", this);
	}

	private async handlePrestigePrep() {
		// Calculate prestige bonuses from current run
		const { GameContext } = await import("@/core/GameContext");
		const context = GameContext.getInstance();

		if (context.currentRun) {
			const character = context.character;

			// Use centralized calculator instead of hardcoded 2%
			const bonuses = BalanceCalculators.calculatePrestigeBonuses({
				attack: character.stats.get("attack"),
				defence: character.stats.get("defence"),
				hp: character.maxHp,
			});

			this.prestigeState.permanentAttack += bonuses.permanentAttack;
			this.prestigeState.permanentDefence += bonuses.permanentDefence;
			this.prestigeState.permanentHP += bonuses.permanentHP;

			this.prestigeState.runsCompleted++;

			// You could add more prestige rewards here
			this.calculateMetaPoints();
		}
	}

	private calculateMetaPoints() {
		// Example: meta points based on level reached
		const metaPointsEarned = Math.floor(this.level * 10);
		this.prestigeState.totalMetaPoints += metaPointsEarned;

		// TODO Emit prestige points, whatever they will be.
		// bus.emit("prestige:metaPointsEarned", metaPointsEarned);
	}

	// ================ ENERGY MANAGEMENT ================

	public spendEnergy(amount: number): boolean {
		if (this.energyCurrent < amount) return false;
		this.energyCurrent -= amount;
		this.emitEnergyChanged();
		return true;
	}

	public refundEnergy(amount: number): boolean {
		if (this.energyCurrent + amount > this.energyMax) return false;
		this.energyCurrent += amount;
		this.emitEnergyChanged();
		return true;
	}

	private emitEnergyChanged() {
		bus.emit("player:energy-changed", {
			current: this.energyCurrent,
			max: this.energyMax,
			allocated: this.energyMax - this.energyCurrent,
		});
	}

	public increaseEnergyMax(amount: number) {
		this.energyMax += amount;
		this.emitEnergyChanged();
	}

	// ================ LEVEL & EXPERIENCE ================

	public gainExperience(amount: number) {
		this.experience += amount;

		// Simple level up formula - adjust as needed
		//const expForNextLevel = this.level * 100;
		while (this.experience >= this.level * 100) {
			this.experience -= this.level * 100;
			this.levelUp();
		}
	}

	private levelUp(): void {
		this.level++;
		bus.emit("player:level-up", this.level);
	}

	// ================ RENOWN MANAGEMENT ================

	public adjustRenown(delta: number): void {
		const oldRenown = this.renown;
		this.renown += delta;

		printLog(`Renown: ${oldRenown} → ${this.renown} (${delta})`, 3, "Player");
		bus.emit("renown:changed", this.renown);
	}

	// ================ GOLD MANAGEMENT =================

	/** Adjust the player's gold by the given delta (positive or negative) */
	public adjustGold(delta: number): void {
		if (delta === 0) return;

		this.gold = Math.max(this.gold + delta, 0);

		const now = Date.now();

		// Track positive income for rolling-window calculations
		if (delta > 0) {
			this.goldIncomeWindow.push({ amount: delta, time: now });
		}

		const incomePerSec = this.calculateGoldIncome();

		/* 		// Prune entries older than 25 seconds
		const WINDOW_MS = 25_000;
		this.goldIncomeWindow = this.goldIncomeWindow.filter((entry) => now - entry.time <= WINDOW_MS);

		const earned = this.goldIncomeWindow.reduce((sum, e) => sum + e.amount, 0);
		const elapsed = this.goldIncomeWindow.length > 0 ? Math.max(now - this.goldIncomeWindow[0].time, 1) : 1;
		// Income per second
		const incomePerSec = earned / (elapsed / 1000); */

		bus.emit("gold:changed" as any, {
			amount: this.gold,
			incomePerSec,
		});
	}

	private calculateGoldIncome(): number {
		const now = Date.now();
		// Prune entries older than 25 seconds
		const WINDOW_MS = 25_000;
		this.goldIncomeWindow = this.goldIncomeWindow.filter((entry) => now - entry.time <= WINDOW_MS);

		const earned = this.goldIncomeWindow.reduce((sum, e) => sum + e.amount, 0);
		const elapsed = this.goldIncomeWindow.length > 0 ? Math.max(now - this.goldIncomeWindow[0].time, 1) : 1;
		// Income per second
		const incomePerSec = earned / (elapsed / 1000);

		bus.emit("gold:changed" as any, {
			amount: this.gold,
			incomePerSec,
		});
		return incomePerSec;
	}

	/** Current gold amount */
	public get currentGold(): number {
		return this.gold;
	}

	/** Spend gold if available; returns true if successful */
	public spendGold(amount: number): boolean {
		if (this.gold < amount) return false;
		this.adjustGold(-amount);
		return true;
	}

	// ================ PRESTIGE ================

	public prestigeReset(): void {
		// Reset run-specific stats
		this.level = 1;
		this.experience = 0;
		this.renown = 0;

		// Reset gold and tracking
		this.gold = 0;
		this.goldIncomeWindow = [];

		this.emitEnergyChanged();
		bus.emit("renown:changed", this.renown);
	}

	// ================ GETTERS ================

	public get playerLevel(): number {
		return this.level;
	}
	public get currentRenown(): number {
		return this.renown;
	}
	public get currentExperience(): number {
		return this.experience;
	}
	public get energy(): { current: number; max: number } {
		return { current: this.energyCurrent, max: this.energyMax };
	}

	public get vigourLevel(): number {
		return this.bloodlineStats.vigour;
	}

	public get bloodlineStatsData(): BloodlineStats {
		return { ...this.bloodlineStats };
	}

	public modifyBloodlineStat(stat: keyof BloodlineStats, amount: number): void {
		this.bloodlineStats[stat] += amount;
	}

	public getBloodlineStat(stat: keyof BloodlineStats): number {
		return this.bloodlineStats[stat];
	}

	public getPrestigeState(): PrestigeState {
		return { ...this.prestigeState };
	}

	public getPrestigeBonuses(): StatsModifier {
		return {
			attack: this.prestigeState.permanentAttack,
			defence: this.prestigeState.permanentDefence,
			hp: this.prestigeState.permanentHP,
		};
	}

	// ================ SINGLETON ================

	public static initSingleton(): Player {
		if (!Player._instance) {
			Player._instance = new Player();
		}
		return Player._instance;
	}

	public static getInstance(): Player {
		if (!this._instance) {
			throw new Error("Player singleton not initialized! Call initSingleton() first.");
		}
		return this._instance;
	}

	public static resetSingleton(): void {
		if (Player._instance) {
			Player._instance.destroy();
			Player._instance = null;
		}
	}

	private destroy() {
		// TODO
	}

	// ================ SAVE/LOAD ================

	save(): PlayerSaveState {
		return {
			level: this.level,
			renown: this.renown,
			gold: this.gold,
			energyCurrent: this.energyCurrent,
			energyMax: this.energyMax,
			experience: this.experience,
			bloodlineStats: this.bloodlineStats,
			prestigeState: this.prestigeState,
		};
	}

	load(state: PlayerSaveState): void {
		this.level = state.level ?? 1;
		this.experience = state.experience ?? 0;
		this.renown = state.renown ?? 0;
		this.gold = state.gold ?? 0;
		this.bloodlineStats = state.bloodlineStats ?? { ...defaultBloodlineStats };
		this.energyCurrent = state.energyCurrent ?? 5;
		this.energyMax = state.energyMax ?? 5;
		this.prestigeState = state.prestigeState ?? { ...DEFAULT_PRESTIGE_STATE };

		// Emit initial state
		this.emitEnergyChanged();
		bus.emit("renown:changed", this.renown);
		// emit initial gold state
		bus.emit("gold:changed" as any, { amount: this.gold, incomePerSec: 0 });
	}

	// DEBUG
	debugEnergy() {
		this.energyMax = 5000;
		this.energyCurrent = 5000;
		this.emitEnergyChanged();
	}
}
