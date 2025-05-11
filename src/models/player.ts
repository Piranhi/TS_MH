import { PlayerCharacter } from "./PlayerCharacter";
import { Bounded } from "./value-objects/Bounded";
import { RegenPool } from "./value-objects/RegenPool";
import { bus } from "../core/EventBus";
import { TrainedStat } from "./TrainedStat";
import { InventoryManager } from "../features/inventory/InventoryManager";
import { EquipmentItemSpec } from "../shared/types";

import { ClassCardManager } from "../features/classcards/ClassCardManager";
import { ClassCard } from "../features/classcards/ClassCard";
import { isEquipmentItem } from "@/shared/type-guards";
import { Equipment } from "./Equipment";

interface PlayerData {
    level: number;
    renown: Bounded;
    experience: number;
    character: PlayerCharacter;
    stamina: RegenPool;
    trainedStats: Record<string, TrainedStat>;
}

export class Player {
    private static _instance: Player | null = null;

    private readonly name = "Player";
    private level: number;
    private renown: Bounded;
    private experience: number;
    private stamina: RegenPool;
    private assignedStamina = 0;
    private staminaMultiplier: number = 1;
    private renownMultiplier: number = 1;

    public character: PlayerCharacter;
    public inventory: InventoryManager;
    private cardManager: ClassCardManager;
    public trainedStats: Map<string, TrainedStat> = new Map();

    private constructor(data: PlayerData) {
        this.level = data.level;
        this.renown = data.renown;
        this.experience = data.experience;
        this.stamina = data.stamina;
        this.trainedStats = new Map(Object.entries(data.trainedStats));
        this.character = new PlayerCharacter();
        this.inventory = new InventoryManager();
        this.cardManager = new ClassCardManager(this.inventory);
        this.inventory.addItemToInventory({
            id: "weaponID",
            name: "Weapon",
            category: "equipment",
            rarity: "common",
            iconUrl: "non",
            quantity: 1,
            equipType: "weapon",
        } as EquipmentItemSpec);
        this.inventory.addItemToInventory({
            id: "chestID",
            name: "Chest",
            category: "equipment",
            rarity: "legendary",
            iconUrl: "none",
            quantity: 1,
            equipType: "chest",
        } as EquipmentItemSpec);
        this.inventory.addItemToInventory(ClassCard.create("warrior_card_01"));
        this.inventory.addItemToInventory(ClassCard.create("bulwark_card_01"));
        this.inventory.addItemToInventory(Equipment.create("chest_01"));
    }

    public static createNew(): Player {
        const defaults: PlayerData = {
            level: 1,
            renown: new Bounded(0, 1000, 0),
            experience: 0,
            character: new PlayerCharacter(),
            stamina: new RegenPool(10, 1, false),
            trainedStats: {
                attack: new TrainedStat({
                    id: "attack",
                    name: "Attack",
                    level: 1,
                    progress: 0,
                    nextThreshold: 50,
                    assignedPoints: 0,
                    baseGainRate: 1,
                    status: "Unlocked",
                }),
                agility: new TrainedStat({
                    id: "agility",
                    name: "Agility",
                    level: 1,
                    progress: 0,
                    nextThreshold: 100,
                    assignedPoints: 0,
                    baseGainRate: 0.5,
                    status: "Locked",
                }),
                crit: new TrainedStat({
                    id: "crit",
                    name: "Crit",
                    level: 1,
                    progress: 0,
                    nextThreshold: 100,
                    assignedPoints: 0,
                    baseGainRate: 0.5,
                    status: "Unlocked",
                }),
            },
        };
        return new Player(defaults);
    }

    static loadFromSave(data: PlayerData): Player {
        return new Player(data);
    }

    async init(): Promise<void> {
        bus.emit("player:initialized", this);
        bus.on("Game:GameTick", (dt) => this.handleGameTick(dt));
        bus.on("Game:UITick", (dt) => this.handleUITick(dt));
        bus.on("reward:renown", (amt) => this.adjustRenown(amt));
    }

    handleGameTick(dt: number): void {}

    handleUITick(dt: number): void {
        this.increaseStamina(dt);
        this.updateStats(dt);
    }

    private updateStats(dt: number) {
        this.trainedStats.forEach((stat) => stat.update(dt));
    }

    public getPlayerCharacter(): PlayerCharacter {
        return this.character;
    }

    public allocateTrainedStat(id: string, rawDelta: number): void {
        const stat = this.trainedStats.get(id);
        if (!stat) return;

        //Only whole point changes
        const delta = Math.trunc(rawDelta);
        if (delta === 0) return;

        if (delta > 0) {
            // spending
            if (!this.stamina.spend(delta)) return; // not enough → abort
            stat.assignedPoints += delta;
        } else {
            // refunding
            const pts = -delta;
            if (stat.assignedPoints < pts) return; // can't refund more than there
            if (!this.stamina.refund(pts)) return; // should always succeed
            stat.assignedPoints -= pts;
        }
        this.emitStamina();
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

    public adjustRenown(delta: number): void {
        this.renown.adjust(delta);
        bus.emit("Renown:Changed", this.renown);
    }

    public static getInstance(): Player {
        if (!this._instance) {
            this._instance = Player.createNew();
        }
        return this._instance;
    }
}
