import { PlayerCharacter } from "./PlayerCharacter";
import { RegenPool } from "./value-objects/RegenPool";
import { bus } from "../core/EventBus";
import { InventoryManager } from "../features/inventory/InventoryManager";
import { ClassCardManager } from "../features/classcards/ClassCardManager";
import { ClassCard } from "../features/classcards/ClassCard";
import { Equipment } from "./Equipment";
import { Saveable } from "@/shared/storage-types";
import { EquipmentManager } from "./EquipmentManager";
import { BigNumber } from "./utils/BigNumber";
import { printLog } from "@/core/DebugManager";
import { TrainedStatManager } from "./TrainedStatManager";
import { SettlementManager } from "@/features/settlement/SettlementManager";
import { HuntManager } from "@/features/hunt/HuntManager";

interface PlayerSaveState {
	level: number;
	renown: BigNumber;
	stamina: RegenPool;
	experience: number;
}

export class Player implements Saveable {
	private static _instance: Player | null = null;

	private readonly name = "Player";
	private level: number;
	private renown: BigNumber;
	private experience: number = 0;
	private stamina: RegenPool;
	private staminaMultiplier: number = 1;
	private renownMultiplier: number = 1;

	public character: PlayerCharacter;
	public inventory: InventoryManager;
	public cardManager: ClassCardManager;
	public equipmentManager: EquipmentManager;
	public settlementManager: SettlementManager;
	public trainedStatManager: TrainedStatManager;
	public huntManager: HuntManager;

	private constructor(opts: {
		inventoryManager: InventoryManager;
		settlementManager: SettlementManager;
		trainedStatsManager: TrainedStatManager;
		huntManager: HuntManager;
	}) {
		(this.level = 1), (this.renown = new BigNumber(0)), (this.experience = 0);
		this.stamina = new RegenPool(10, 1, false);
		this.inventory = opts.inventoryManager;
		this.settlementManager = opts.settlementManager;
		this.trainedStatManager = opts.trainedStatsManager;
		this.huntManager = opts.huntManager;
		this.cardManager = new ClassCardManager();
		this.equipmentManager = new EquipmentManager();
		this.character = new PlayerCharacter();

		bus.on("game:newGame", () => {
			this.inventory.addItemToInventory(ClassCard.create("warrior_card_01"));
			this.inventory.addItemToInventory(ClassCard.create("bulwark_card_01"));
			this.inventory.addItemToInventory(Equipment.create("tier1_chest"));
		});
		bus.on("game:gameReady", () => {
			bus.on("Game:GameTick", (dt) => this.handleGameTick(dt));
			bus.on("Game:UITick", (dt) => this.handleUITick(dt));
			bus.on("renown:award", (amt) => this.adjustRenown(amt));
			bus.emit("player:initialized", this);
		});
	}

	handleGameTick(dt: number): void {
		this.increaseStamina(dt);
	}

	handleUITick(dt: number): void {}

	public getPlayerCharacter(): PlayerCharacter {
		return this.character;
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

	public adjustRenown(delta: BigNumber | number): void {
		this.renown = this.renown.add(delta);
		printLog("Renown Change. Incoming:" + delta + ", total: " + this.renown.toString(), 3, "player.ts");
		bus.emit("renown:changed", this.renown);
	}

	public static initSingleton(opts: {
		inventoryManager: InventoryManager;
		settlementManager: SettlementManager;
		trainedStatsManager: TrainedStatManager;
		huntManager: HuntManager;
	}): Player {
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

	save(): PlayerSaveState {
		return {
			level: this.level,
			renown: this.renown,
			stamina: this.stamina,
			experience: this.experience,
		};
	}

	load(state: PlayerSaveState): void {
		this.level = state.level;
		this.stamina = RegenPool.fromJSON(state.stamina);
		this.renown = BigNumber.fromJSON(state.renown);
		this.experience = state.experience;
		this.emitStamina();
		bus.emit("renown:changed", this.renown);
	}
}
