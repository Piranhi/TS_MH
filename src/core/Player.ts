import { bus } from "../core/EventBus";
import { InventoryManager } from "../features/inventory/InventoryManager";
import { Saveable } from "@/shared/storage-types";
import { printLog } from "@/core/DebugManager";
import { SettlementManager } from "@/features/settlement/SettlementManager";
import { bindEvent } from "@/shared/utils/busUtils";
import { PrestigeState } from "@/shared/stats-types";
import { Destroyable } from "@/models/Destroyable";
import { BigNumber } from "@/models/utils/BigNumber";
import { RegenPool } from "@/models/value-objects/RegenPool";
import { StatsModifier } from "@/models/Stats";

interface PlayerSaveState {
	level: number;
	renown: BigNumber;
	stamina: RegenPool;
	experience: number;
	heirBonuses: StatsModifier[];
	prestigeState: PrestigeState;
}

const defaultPrestigeState: PrestigeState = {
	runsCompleted: 0,
	totalMetaPoints: 0,
	permanentAttack: 0,
	permanentDefence: 0,
	permanentHP: 0,
};

export class Player extends Destroyable implements Saveable {
	private static _instance: Player | null = null;

	private level: number = 1;
	private renown: BigNumber;
	private experience: number = 0;
	private stamina: RegenPool;
	private heirBonuses: StatsModifier[] = [];
	private prestigeState: PrestigeState;

	constructor() {
		super();
		this.renown = new BigNumber(0);
		this.experience = 0;
		this.stamina = new RegenPool(10, 1, false);
		this.prestigeState = { ...defaultPrestigeState };

		bindEvent(this.eventBindings, "game:newGame", () => this.handleNewGame());
		bindEvent(this.eventBindings, "game:gameReady", () => this.handleGameReady());
		bindEvent(this.eventBindings, "game:prestigePrep", () => this.handlePrestigePrep());
	}

	private async handleNewGame() {
		// Import context to access inventory
		const context = (await import("@/core/GameContext")).GameContext.getInstance();
		context.inventory.addLootById("warrior_card_01");
		context.inventory.addLootById("bulwark_card_01");
		context.inventory.addLootById("tier1_chest");
	}

	private handleGameReady() {
		bindEvent(this.eventBindings, "Game:GameTick", (dt) => this.handleGameTick(dt));
		bindEvent(this.eventBindings, "renown:award", (amt) => this.adjustRenown(amt));
		bus.emit("player:initialized", this);
	}

	private async handlePrestigePrep() {
		// Import context to access current character
		const context = (await import("@/core/GameContext")).GameContext.getInstance();
		if (context.currentRun) {
			const character = context.character;
			this.prestigeState.permanentAttack += 0.02 * character.stats.get("attack");
			this.prestigeState.permanentDefence += 0.02 * character.stats.get("defence");
			this.prestigeState.permanentHP += 0.02 * character.maxHp.toNumber();
			this.prestigeState.runsCompleted++;
		}
	}

	handleGameTick(dt: number): void {
		this.increaseStamina(dt);
	}

	destroy() {
		super.destroy();
		this.stamina.destroy();
	}

	public prestigeReset(): void {
		// Reset run-specific stats
		this.level = 1;
		this.experience = 0;
		this.stamina = new RegenPool(10, 1, false);
		this.setRenown(new BigNumber(0));

		// Re-bind stamina events
		this.emitStamina();
	}

	public getPrestigeState(): PrestigeState {
		return { ...this.prestigeState };
	}

	public spendStamina(delta: number): boolean {
		if (!this.stamina.spend(delta)) return false;
		this.emitStamina();
		return true;
	}

	public refundStamina(delta: number): boolean {
		if (!this.stamina.refund(delta)) return false;
		this.emitStamina();
		return true;
	}

	private emitStamina() {
		bus.emit("player:stamina-changed", {
			current: this.stamina.current,
			allocated: this.stamina.allocated,
			max: this.stamina.max,
			effective: this.stamina.effective,
		});
	}

	private increaseStamina(delta: number): void {
		this.stamina.regen(delta);
		this.emitStamina();
	}

	public levelUp(): void {
		this.level += 1;
		bus.emit("player:level-up", this.level);
	}

	public setRenown(value: BigNumber): void {
		this.renown = value;
		printLog("Renown set to:" + value.toString(), 3, "player.ts", "player");
		bus.emit("renown:changed", this.renown);
	}

	public adjustRenown(delta: BigNumber | number): void {
		this.renown = this.renown.add(delta);
		printLog("Renown Change. Incoming:" + delta + ", total: " + this.renown.toString(), 3, "player.ts");
		bus.emit("renown:changed", this.renown);
	}

	public getLevel(): number {
		return this.level;
	}

	public getRenown(): BigNumber {
		return this.renown;
	}

	public static initSingleton(opts: { inventoryManager: InventoryManager; settlementManager: SettlementManager }): Player {
		if (!Player._instance) {
			Player._instance = new Player(opts);
		}
		return Player._instance;
	}

	public static getInstance(): Player {
		if (!this._instance) {
			throw new Error("Player singleton not yet initialized!");
		}
		return this._instance;
	}

	public static resetSingleton(): void {
		if (Player._instance) {
			Player._instance.destroy();
			Player._instance = null;
		}
	}

	save(): PlayerSaveState {
		return {
			level: this.level,
			renown: this.renown,
			stamina: this.stamina,
			experience: this.experience,
			heirBonuses: this.heirBonuses,
			prestigeState: this.prestigeState,
		};
	}

	load(state: PlayerSaveState): void {
		this.level = state.level || 1;
		this.stamina = RegenPool.fromJSON(state.stamina);
		this.renown = BigNumber.fromJSON(state.renown);
		this.experience = state.experience || 0;
		this.heirBonuses = state.heirBonuses || [];
		this.prestigeState = state.prestigeState || { ...defaultPrestigeState };
		this.emitStamina();
		bus.emit("renown:changed", this.renown);
	}
}
