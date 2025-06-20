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
import { BlacksmithManager } from "@/features/settlement/BlacksmithManager";
import rawUpgrades from "@/data/upgrades.json" assert { type: "json" };
import { ResearchSpec } from "@/shared/types";
import { BlacksmithUpgradeSpec } from "@/shared/types";
import { ModifierEngine } from "./ModifierEngine";
import { GAME_BALANCE } from "@/balance/GameBalance";

export class GameServices {
	private static _instance: GameServices;

	public readonly saveManager: SaveManager;
	public readonly screenManager: ScreenManager;
	public readonly statsManager: StatsManager;
	public readonly milestoneManager: MilestoneManager;
	public readonly offlineManager: OfflineProgressManager;
	public readonly modifierEngine: ModifierEngine;

	// Persistent managers that survive prestige
	public readonly inventoryManager: InventoryManager;
	public readonly settlementManager: SettlementManager;
	public readonly libraryManager: LibraryManager;
	public readonly blacksmithManager: BlacksmithManager;

	private constructor() {
		this.saveManager = new SaveManager();
		this.screenManager = new ScreenManager();
		this.statsManager = StatsManager.instance;
		this.milestoneManager = MilestoneManager.instance;
		this.inventoryManager = new InventoryManager();
		this.settlementManager = new SettlementManager();
		const { research = [], blacksmith = [] } = rawUpgrades as any;

		this.libraryManager = new LibraryManager();
		this.libraryManager.registerResearch(research as ResearchSpec[]);
		this.blacksmithManager = new BlacksmithManager();
		this.blacksmithManager.registerUpgrades(blacksmith as BlacksmithUpgradeSpec[]);
		this.offlineManager = new OfflineProgressManager();
		this.modifierEngine = new ModifierEngine({
			...GAME_BALANCE.modifiers,
			layers: [...GAME_BALANCE.modifiers.layers],
		});
		this.saveManager.register("modifiers", this.modifierEngine);
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
