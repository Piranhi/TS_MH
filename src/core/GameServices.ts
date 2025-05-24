// ===================================================
// GameServices.ts - Persistent services across runs
// ===================================================
import { SaveManager } from "./SaveManager";
import { ScreenManager } from "./ScreenManager";
import { InventoryManager } from "@/features/inventory/InventoryManager";
import { SettlementManager } from "@/features/settlement/SettlementManager";
import { StatsManager } from "@/models/StatsManager";
import { MilestoneManager } from "@/models/MilestoneManager";

export class GameServices {
	private static _instance: GameServices;

	public readonly saveManager: SaveManager;
	public readonly screenManager: ScreenManager;
	public readonly statsManager: StatsManager;
	public readonly milestoneManager: MilestoneManager;

	// Persistent managers that survive prestige
	public readonly inventoryManager: InventoryManager;
	public readonly settlementManager: SettlementManager;

	private constructor() {
		this.saveManager = new SaveManager();
		this.screenManager = new ScreenManager();
		this.statsManager = StatsManager.instance;
		this.milestoneManager = MilestoneManager.instance;
		this.inventoryManager = new InventoryManager();
		this.settlementManager = new SettlementManager();
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
