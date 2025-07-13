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
import { RecruitService } from "@/features/settlement/RecruitService";
import { ClassManager } from "@/features/classes/ClassManager";
import { ClassSpec } from "@/features/classes/ClassTypes";
import rawClasses from "@/data/classes.json" assert { type: "json" };
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
        public readonly recruitService: RecruitService;
        public readonly classManager: ClassManager;

	private constructor() {
		this.saveManager = new SaveManager();
		this.screenManager = new ScreenManager();
		this.statsManager = StatsManager.instance;
		this.milestoneManager = MilestoneManager.instance;
		this.inventoryManager = new InventoryManager();
		this.settlementManager = new SettlementManager();
                this.libraryManager = new LibraryManager();
                this.recruitService = new RecruitService();
		this.offlineManager = new OfflineProgressManager();
		this.classManager = new ClassManager(rawClasses as ClassSpec[]);
		this.modifierEngine = new ModifierEngine({
			...GAME_BALANCE.modifiers,
			layers: [...GAME_BALANCE.modifiers.layers],
		});
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
