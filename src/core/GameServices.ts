import { SaveManager } from "./SaveManager";

// Game services that persist across runs but aren't tied to Player
export class GameServices {
    private static _instance: GameServices;

    public readonly saveManager: SaveManager;

    private constructor() {
        this.saveManager = new SaveManager();
    }

    static getInstance(): GameServices {
        if (!GameServices._instance) {
            GameServices._instance = new GameServices();
        }
        return GameServices._instance;
    }
}

// Usage: GameServices.getInstance().audio.playSound("victory");
