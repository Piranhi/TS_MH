import { Player } from "@/models/player";
import { GameServices } from "./GameServices";
import { GameRun } from "./GameRun";
import { PlayerCharacter } from "@/models/PlayerCharacter";
import { HuntManager } from "@/features/hunt/HuntManager";
import { InventoryManager } from "@/features/inventory/InventoryManager";

export class GameContext {
    private static _instance: GameContext | null = null;

    public readonly player: Player;
    public readonly services: GameServices;
    public currentRun: GameRun | null = null;

    private constructor(player: Player, services: GameServices) {
        this.player = player;
        this.services = services;
    }

    public static initialize(player: Player, services: GameServices): GameContext {
        if (GameContext._instance) {
            throw new Error("GameContext already initialized!");
        }
        GameContext._instance = new GameContext(player, services);
        return GameContext._instance;
    }

    public static getInstance(): GameContext {
        if (!GameContext._instance) {
            throw new Error("GameContext not initialized!");
        }
        return GameContext._instance;
    }

    // Convenience accessors
    public get character(): PlayerCharacter {
        if (!this.currentRun) throw new Error("No active run!");
        return this.currentRun.character;
    }

    public get hunt(): HuntManager {
        if (!this.currentRun) throw new Error("No active run!");
        return this.currentRun.huntManager;
    }

    public get inventory(): InventoryManager {
        return this.player.inventory;
    }
}

// Usage: GameContext.getInstance().character.attack
// Usage: GameContext.getInstance().inventory.addItem(item)
