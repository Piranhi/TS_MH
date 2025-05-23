import { PlayerCharacter } from "./PlayerCharacter";
import { RegenPool } from "./value-objects/RegenPool";
import { bus } from "../core/EventBus";
import { InventoryManager } from "../features/inventory/InventoryManager";
import { ClassCardManager } from "../features/classcards/ClassCardManager";
import { Saveable } from "@/shared/storage-types";
import { EquipmentManager } from "./EquipmentManager";
import { BigNumber } from "./utils/BigNumber";
import { printLog } from "@/core/DebugManager";
import { TrainedStatManager } from "./TrainedStatManager";
import { SettlementManager } from "@/features/settlement/SettlementManager";
import { HuntManager } from "@/features/hunt/HuntManager";
import { StatsModifier } from "./Stats";
import { Destroyable } from "./Destroyable";
import { bindEvent } from "@/shared/utils/busUtils";
import { PrestigeState } from "@/shared/stats-types";

interface PlayerSaveState {
    level: number;
    renown: BigNumber;
    stamina: RegenPool;
    experience: number;
    heirBonuses: StatsModifier[];
    prestigeState: PrestigeState;
}

const defaultPrestigeState: PrestigeState = { runsCompleted: 0, totalMetaPoints: 0, permanentAttack: 0, permanentDefence: 0, permanentHP: 0 };

export class Player extends Destroyable implements Saveable {
    private static _instance: Player | null = null;

    private level: number = 1;
    private renown: BigNumber;
    private experience: number = 0;
    private stamina: RegenPool;
    private heirBonuses: StatsModifier[] = [];
    private prestigeState: PrestigeState;

    // Destroyable
    public character: PlayerCharacter | null = null;
    public trainedStatManager: TrainedStatManager | null = null;
    public huntManager: HuntManager | null = null;
    // Persistent
    public inventory: InventoryManager;
    public cardManager: ClassCardManager;
    public equipmentManager: EquipmentManager;
    public settlementManager: SettlementManager;

    private constructor(opts: { inventoryManager: InventoryManager; settlementManager: SettlementManager; trainedStatsManager: TrainedStatManager; huntManager: HuntManager }) {
        super();
        (this.renown = new BigNumber(0)), (this.experience = 0);
        this.stamina = new RegenPool(10, 1, false);
        this.inventory = opts.inventoryManager;
        this.settlementManager = opts.settlementManager;
        this.trainedStatManager = opts.trainedStatsManager;
        this.huntManager = opts.huntManager;
        this.cardManager = new ClassCardManager();
        this.equipmentManager = new EquipmentManager();
        this.prestigeState = defaultPrestigeState;
        this.character = new PlayerCharacter(this.prestigeState);

        this.character.init();

        bindEvent(this.eventBindings, "game:newGame", () => this.handleNewGame());
        bindEvent(this.eventBindings, "game:gameReady", () => this.handleGameReady());
        bindEvent(this.eventBindings, "game:prestigePrep", () => this.handlePrestige());
    }

    private handleNewGame() {
        this.inventory.addLootById("warrior_card_01"); //ClassCard.createRaw("warrior_card_01", 1));
        this.inventory.addLootById("bulwark_card_01");
        this.inventory.addLootById("tier1_chest");
    }

    private handleGameReady() {
        bindEvent(this.eventBindings, "Game:GameTick", (dt) => this.handleGameTick(dt));
        bindEvent(this.eventBindings, "renown:award", (amt) => this.adjustRenown(amt));
        bus.emit("player:initialized", this);
    }

    private handlePrestige() {
        this.prestigeState.permanentAttack += 0.02 * this.getPlayerCharacter().stats.get("attack");
        this.prestigeState.permanentDefence += 0.02 * this.getPlayerCharacter().stats.get("defence");
        this.prestigeState.permanentHP += 0.02 * this.getPlayerCharacter().maxHp.toNumber();
    }

    handleGameTick(dt: number): void {
        this.increaseStamina(dt);
    }

    destroy() {
        super.destroy();
        // Destroyable Classes
        this.huntManager!.destroy();
        this.trainedStatManager!.destroy();
        this.character!.destroy();
        this.stamina.destroy();

        this.huntManager = null;
        this.trainedStatManager = null;
        this.character = null;

        //Stats
        this.stamina.destroy();
    }

    // Import new data from GameApp
    prestigeReset(opts: { trainedStatsManager: TrainedStatManager; huntManager: HuntManager }) {
        this.huntManager = opts.huntManager;
        this.trainedStatManager = opts.trainedStatsManager;
        this.character = new PlayerCharacter(this.prestigeState);
        this.emitStamina();
        this.character.init();
        this.setRenown(new BigNumber(0));
    }

    public getPlayerCharacter(): PlayerCharacter {
        if (!this.character) throw new Error("PlayerCharacter not initialized!");
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

    public static initSingleton(opts: { inventoryManager: InventoryManager; settlementManager: SettlementManager; trainedStatsManager: TrainedStatManager; huntManager: HuntManager }): Player {
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
        this.level = state.level;
        this.stamina = RegenPool.fromJSON(state.stamina);
        this.renown = BigNumber.fromJSON(state.renown);
        this.experience = state.experience;
        this.heirBonuses = state.heirBonuses;
        this.prestigeState = state.prestigeState;
        this.emitStamina();
        bus.emit("renown:changed", this.renown);
    }
}
