import { bus } from "../core/EventBus";
import { Saveable } from "@/shared/storage-types";
import { printLog } from "@/core/DebugManager";
import { bindEvent } from "@/shared/utils/busUtils";
import { PrestigeState } from "@/shared/stats-types";
import { BigNumber } from "@/models/utils/BigNumber";
import { RegenPool } from "@/models/value-objects/RegenPool";
import { Destroyable } from "@/models/Destroyable";
import { StatsModifier } from "@/models/Stats";

interface PlayerSaveState {
	level: number;
	renown: BigNumber;
	stamina: RegenPool;
	experience: number;
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
export class Player extends Destroyable implements Saveable {
	private static _instance: Player | null = null;

	// Persistent player stats
	private level: number = 1;
	private renown = new BigNumber(0);
	private experience: number = 0;
	private stamina: RegenPool;
	private prestigeState: PrestigeState;

	private constructor() {
		super();
		this.stamina = new RegenPool(10, 1, false);
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
		bindEvent(this.eventBindings, "Game:GameTick", (dt) => this.regenStamina(dt));
		bindEvent(this.eventBindings, "renown:award", (amt) => this.adjustRenown(amt));
		bus.emit("player:initialized", this);
	}

	private async handlePrestigePrep() {
		// Calculate prestige bonuses from current run
		const { GameContext } = await import("@/core/GameContext");
		const context = GameContext.getInstance();

		if (context.currentRun) {
			const character = context.character;
			const stats = character.stats;

			// Calculate permanent stat bonuses (2% of current stats)
			this.prestigeState.permanentAttack += Math.floor(0.02 * stats.get("attack"));
			this.prestigeState.permanentDefence += Math.floor(0.02 * stats.get("defence"));
			this.prestigeState.permanentHP += Math.floor(0.02 * character.maxHp.toNumber());
			this.prestigeState.runsCompleted++;

			// You could add more prestige rewards here
			this.calculateMetaPoints();
		}
	}

	private calculateMetaPoints() {
		// Example: meta points based on level reached
		const metaPointsEarned = Math.floor(this.level * 10);
		this.prestigeState.totalMetaPoints += metaPointsEarned;

		bus.emit("prestige:metaPointsEarned", metaPointsEarned);
	}

	// ================ STAMINA MANAGEMENT ================

	public spendStamina(amount: number): boolean {
		if (!this.stamina.spend(amount)) return false;
		this.emitStaminaChanged();
		return true;
	}

	public refundStamina(amount: number): boolean {
		if (!this.stamina.refund(amount)) return false;
		this.emitStaminaChanged();
		return true;
	}

	private regenStamina(dt: number): void {
		this.stamina.regen(dt);
		this.emitStaminaChanged();
	}

	private emitStaminaChanged() {
		bus.emit("player:stamina-changed", {
			current: this.stamina.current,
			allocated: this.stamina.allocated,
			max: this.stamina.max,
			effective: this.stamina.effective,
		});
	}

	// ================ LEVEL & EXPERIENCE ================

	public gainExperience(amount: number) {
		this.experience += amount;

		// Simple level up formula - adjust as needed
		const expForNextLevel = this.level * 100;
		while (this.experience >= expForNextLevel) {
			this.experience -= expForNextLevel;
			this.levelUp();
		}
	}

	private levelUp(): void {
		this.level++;
		this.stamina.setMax(this.stamina.max + 2); // Increase max stamina on level up
		bus.emit("player:level-up", this.level);
	}

	// ================ RENOWN MANAGEMENT ================

	public adjustRenown(delta: BigNumber | number): void {
		const oldRenown = this.renown;
		this.renown = this.renown.add(delta);

		printLog(`Renown: ${oldRenown.toString()} → ${this.renown.toString()} (${delta})`, 3, "Player");
		bus.emit("renown:changed", this.renown);

		// Track lifetime renown for achievements/stats
		if (delta instanceof BigNumber ? delta.gt(0) : delta > 0) {
			bus.emit("stats:renownGained", delta);
		}
	}

	// ================ PRESTIGE ================

	public prestigeReset(): void {
		// Reset run-specific stats
		this.level = 1;
		this.experience = 0;
		this.renown = new BigNumber(0);

		// Reset stamina but keep max upgrades?
		const baseStamina = 10 + Math.floor(this.prestigeState.runsCompleted * 2);
		this.stamina = new RegenPool(baseStamina, 1 + this.prestigeState.runsCompleted * 0.1, false);

		this.emitStaminaChanged();
		bus.emit("renown:changed", this.renown);
	}

	// ================ GETTERS ================

	public get playerLevel(): number {
		return this.level;
	}
	public get currentRenown(): BigNumber {
		return this.renown;
	}
	public get currentExperience(): number {
		return this.experience;
	}
	public get staminaPool(): RegenPool {
		return this.stamina;
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

	// ================ SAVE/LOAD ================

	save(): PlayerSaveState {
		return {
			level: this.level,
			renown: this.renown,
			stamina: this.stamina,
			experience: this.experience,
			prestigeState: this.prestigeState,
		};
	}

	load(state: PlayerSaveState): void {
		this.level = state.level ?? 1;
		this.experience = state.experience ?? 0;
		this.renown = state.renown ? BigNumber.fromJSON(state.renown) : new BigNumber(0);
		this.stamina = state.stamina ? RegenPool.fromJSON(state.stamina) : new RegenPool(10, 1, false);
		this.prestigeState = state.prestigeState ?? { ...DEFAULT_PRESTIGE_STATE };

		// Emit initial state
		this.emitStaminaChanged();
		bus.emit("renown:changed", this.renown);
	}

	// ================ CLEANUP ================

	destroy() {
		super.destroy();
		this.stamina.destroy();
	}

	// DEBUG
	debugStamina() {
		this.stamina.setMax(5000);
		this.stamina.setCurrent(5000);
	}
}
