import { PlayerCharacter } from "./PlayerCharacter";
import { RegenPool } from "./value-objects/RegenPool";
import { bus } from "../core/EventBus";
import { InventoryManager } from "../features/inventory/InventoryManager";
import { ClassCardManager } from "../features/classcards/ClassCardManager";
import { ClassCard } from "../features/classcards/ClassCard";
import { Equipment } from "./Equipment";
import { Saveable } from "@/shared/storage-types";
import { EquipmentManager } from "./EquipmentManager";
import { saveManager } from "@/core/SaveManager";
import { LifetimeStats } from "./LifetimeStats";
import { BigNumber } from "./utils/BigNumber";
import { printLog } from "@/core/DebugManager";
import { TrainedStatManager } from "./TrainedStatManager";
import { SettlementManager } from "@/features/settlement/SettlementManager";

interface PlayerData {
	level: number;
	renown: BigNumber;
	experience: number;
	character: PlayerCharacter;
	stamina: RegenPool;
}

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

	private constructor(data: PlayerData) {
		this.level = data.level;
		this.renown = data.renown;
		this.experience = data.experience;
		this.stamina = data.stamina;
		this.character = new PlayerCharacter();
		this.inventory = new InventoryManager();
		this.cardManager = new ClassCardManager(this.inventory);
		this.equipmentManager = new EquipmentManager(this.inventory);
		this.settlementManager = new SettlementManager();
		this.trainedStatManager = new TrainedStatManager(this);
		//this.lifetimeStats = new LifetimeStats();

		this.inventory.addItemToInventory(ClassCard.create("warrior_card_01"));
		this.inventory.addItemToInventory(ClassCard.create("bulwark_card_01"));
		this.inventory.addItemToInventory(Equipment.create("tier1_chest"));
	}

	public static createNew(): Player {
		const defaults: PlayerData = {
			level: 1,
			renown: new BigNumber(0),
			experience: 0,
			character: new PlayerCharacter(),
			stamina: new RegenPool(10, 1, false),
		};
		return new Player(defaults);
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

	async init(): Promise<void> {
		bus.emit("player:initialized", this);
		bus.on("Game:GameTick", (dt) => this.handleGameTick(dt));
		bus.on("Game:UITick", (dt) => this.handleUITick(dt));
		bus.on("renown:award", (amt) => this.adjustRenown(amt));
		saveManager.register("Player", this);
	}

	handleGameTick(dt: number): void {
		this.increaseStamina(dt);
	}

	handleUITick(dt: number): void {}

	public getPlayerCharacter(): PlayerCharacter {
		return this.character;
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

	public static getInstance(): Player {
		if (!this._instance) {
			this._instance = Player.createNew();
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
		this.stamina = state.stamina;
		this.renown = state.renown;
		this.experience = state.experience;
		this.emitStamina();
		bus.emit("renown:changed", this.renown);
	}
}
