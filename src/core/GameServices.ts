// ===================================================
// GameServices.ts - Persistent services across runs
// ===================================================
import { SaveManager } from "./SaveManager";
import { ScreenManager } from "./ScreenManager";
import { InventoryManager } from "@/features/inventory/InventoryManager";
import { SettlementManager } from "@/features/settlement/SettlementManager";
import { StatsManager } from "@/models/StatsManager";
import { MilestoneManager } from "@/models/MilestoneManager";
import { OfflineProgressManager } from "@/models/OfflineProgress";
import { LibraryManager } from "@/features/settlement/LibraryManager";
import rawResearch from "@/data/research.json" assert { type: "json" };
import { ResearchSpec } from "@/shared/types";

export class GameServices {
	private static _instance: GameServices;

	public readonly saveManager: SaveManager;
	public readonly screenManager: ScreenManager;
	public readonly statsManager: StatsManager;
	public readonly milestoneManager: MilestoneManager;
	public readonly offlineManager: OfflineProgressManager;

	// Persistent managers that survive prestige
	public readonly inventoryManager: InventoryManager;
        public readonly settlementManager: SettlementManager;
        public readonly libraryManager: LibraryManager;

	private constructor() {
		this.saveManager = new SaveManager();
		this.screenManager = new ScreenManager();
		this.statsManager = StatsManager.instance;
		this.milestoneManager = MilestoneManager.instance;
		this.inventoryManager = new InventoryManager();
                this.settlementManager = new SettlementManager();
                this.libraryManager = new LibraryManager();
                this.libraryManager.registerResearch(rawResearch as ResearchSpec[]);
                this.offlineManager = new OfflineProgressManager();
	}

	static getInstance(): GameServices {
		if (!GameServices._instance) {
			GameServices._instance = new GameServices();
		}
		return GameServices._instance;
	}

	public destroy(): void {
		this.screenManager.destroyAll();
	}
}
