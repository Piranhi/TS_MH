// ===================================================
// GameContext.ts - Central access point
// ===================================================
import { Player } from "@/core/Player";
import { GameServices } from "./GameServices";
import { GameRun } from "./GameRun";
import { PlayerCharacter } from "@/models/PlayerCharacter";
import { HuntManager } from "@/features/hunt/HuntManager";
import { InventoryManager } from "@/features/inventory/InventoryManager";
import { SettlementManager } from "@/features/settlement/SettlementManager";
import { LibraryManager } from "@/features/settlement/LibraryManager";
import { BlacksmithManager } from "@/features/settlement/BlacksmithManager";
import { bus } from "./EventBus";
import { SaveManager } from "./SaveManager";
import { ScreenManager } from "./ScreenManager";
import { PrestigeState } from "@/shared/stats-types";
import { OfflineProgressManager } from "@/models/OfflineProgress";
import { ResourceManager } from "@/features/inventory/ResourceManager";
import { MineManager } from "@/features/mine/MineManager";

export class GameContext {
	private static _instance: GameContext | null = null;

	public readonly player: Player;
	public readonly services: GameServices;
	public currentRun: GameRun | null = null;

	public flags = {
		isNewRun: true, // Used to prevent loading of old data when prestiging
	};

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

	public startNewRun(prestigeState: PrestigeState, newRun: boolean): void {
		this.flags.isNewRun = newRun;
		if (this.currentRun) {
			this.currentRun.destroy();
		}
		this.currentRun = new GameRun({
			prestigeState,
			context: this,
		});
		bus.emit("gameRun:started", this.currentRun);
	}

	public endCurrentRun(): void {
		if (this.currentRun) {
			const stats = this.currentRun.getRunStats();
			bus.emit("gameRun:ended", stats);
			this.currentRun.destroy();
			this.currentRun = null;
		}
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

        public get resources(): ResourceManager {
                if (!this.currentRun) throw new Error("No active run!");
                return this.currentRun?.resourceManager;
        }

        public get mine(): MineManager {
                if (!this.currentRun) throw new Error("No active run!");
                return this.currentRun.mineManager;
        }

	public get inventory(): InventoryManager {
		return this.services.inventoryManager;
	}

	public get settlement(): SettlementManager {
		return this.services.settlementManager;
	}

        public get library(): LibraryManager {
                return this.services.libraryManager;
        }

        public get blacksmith(): BlacksmithManager {
                return this.services.blacksmithManager;
        }

	public get saves(): SaveManager {
		return this.services.saveManager;
	}

	public get screens(): ScreenManager {
		return this.services.screenManager;
	}

	public get offlineManager(): OfflineProgressManager {
		return this.services.offlineManager;
	}

	public get isOfflinePaused(): boolean {
		return this.services.offlineManager.areSystemsPaused();
	}
}
