// ===================================================
// GameApp.ts - Simplified bootstrapper
// ===================================================
import { GameContext } from "./GameContext";
import { GameServices } from "./GameServices";
import { Player } from "./Player";
import { engine } from "./GameEngine";
import { SidebarDisplay } from "../ui/components/SidebarDisplay";
import { HeaderDisplay } from "../ui/components/HeaderDisplay";
import { DebugMenu } from "@/ui/components/Debug-Menu";
import { bus } from "./EventBus";
import { initGameData } from "./gameData";
import { PlayerStatsDisplay } from "@/ui/components/PlayerStatsDisplay";
import { ResourceData } from "@/shared/types";
import { Area } from "@/models/Area";
import { ToastManager } from "@/ui/components/ToastManager";

export class GameApp {
    private readonly root: HTMLElement;
    private container: HTMLElement;
    private context!: GameContext;
    private services!: GameServices;
    //private offlineManager!: OfflineProgressManager;

    // UI Components
    private sidebar!: SidebarDisplay;
    private header!: HeaderDisplay;
    private playerStatsDiplay!: PlayerStatsDisplay;
    private toast!: ToastManager;
    private pendingResourceState: Map<string, ResourceData> | null = null;

    constructor(root: HTMLElement) {
        this.root = root;
        const maybeArea = root.querySelector<HTMLElement>("#game-area");
        if (!maybeArea) throw new Error("#game-area not found");
        this.container = maybeArea;
        this.toast = ToastManager.instance;
        bus.on("hunt:areaUnlocked", (id) => {
            const spec = Area.specById.get(id);
            const name = spec?.displayName ?? id;
            this.toast.enqueue("Area Unlocked", `You can now explore ${name}!`);
        });
    }

    async init(): Promise<void> {
        // 1. Initialize game data
        initGameData();

        // 2. Initialize services
        this.services = GameServices.getInstance();

        // 3. Initialize player
        const player = Player.initSingleton();

        // 4. Initialize context
        this.context = GameContext.initialize(player, this.services);

        // 5. Register persistent systems for save/load
        this.registerPersistentSystems();

        // 6. Emit init event
        bus.emit("game:init");

        // 7. Load game or start new
        if (!this.services.saveManager.loadAll()) {
            this.services.saveManager.clearSaves();
            bus.emit("game:newGame");
            // Start first run
            this.context.startNewRun(player.getPrestigeState(), true);
        } else {
            // Resume existing run
            const prestigeState = player.getPrestigeState();
            this.context.startNewRun(prestigeState, false);
        }

        // 8. Build UI
        this.buildUI();
        this.context.screens.init(this.container);

        // 9. Start game
        this.context.flags.isGameReady = true;
        bus.emit("game:gameReady");
        this.initUI();
        this.buildDebugMenu();

        // 10. Setup Offline Manager
        this.services.offlineManager.initalize();

        // 11. Setup prestige handlers
        this.setupPrestigeHandlers();

        // 12. Start Tick
        engine.start();
    }

    private registerPersistentSystems() {
        const saveManager = this.services.saveManager;
        saveManager.register("player", this.context.player);
        saveManager.register("inventory", this.services.inventoryManager);
        saveManager.register("settlement", this.services.settlementManager);
        saveManager.register("milestonesManager", this.services.milestoneManager);
        saveManager.register("statsManager", this.services.statsManager);
        saveManager.register("libraryManager", this.services.libraryManager);
        saveManager.register("recruitService", this.services.recruitService);
        saveManager.register("classManager", this.services.classManager);
        saveManager.register("modifiers", this.services.modifierEngine);
    }

    private setupPrestigeHandlers() {
        bus.on("game:prestigePrep", () => this.handlePrestigePrep());
        bus.on("game:prestige", () => this.handlePrestige());
    }

    // ---------------------- PRESTIGE ----------------------------------
    private handlePrestigePrep() {
        console.log("Preparing for prestige...");

        // Save current state
        this.services.saveManager.saveAll();

        // Capture resource state for next run
        if (this.context.currentRun) {
            this.pendingResourceState = this.context.resources.getAllResources();
        }

        // End current run
        this.context.endCurrentRun();

        // Clean up UI
        this.context.screens.destroyAll();

        // Transfer run renown into settlement pool before resetting
        const runRenown = this.context.player.currentRenown;
        this.services.recruitService.addSettlementRenown(runRenown);
        // Reset player for new run
        this.context.player.prestigeReset();
    }

    private handlePrestige() {
        console.log("Starting new prestige run...");

        // Start new run with updated prestige state
        const prestigeState = this.context.player.getPrestigeState();
        this.context.startNewRun(prestigeState, true);

        // Apply carried over resource levels and starting amounts
        if (this.pendingResourceState) {
            this.context.resources.applyPrestigeResources(this.pendingResourceState);
            this.pendingResourceState = null;
        }

        // Rebuild UI

        this.context.screens.init(this.container);
    }

    private buildUI() {
        this.sidebar = new SidebarDisplay((name) => this.context.screens.show(name));
        this.header = new HeaderDisplay(this.root.querySelector("#header")!);
        this.playerStatsDiplay = new PlayerStatsDisplay(this.root.querySelector("#player-statlist")!);

        this.sidebar.build();
        this.header.build();
    }

    private initUI() {
        this.header.init();
    }

    private buildDebugMenu() {
        const debugMenu = new DebugMenu();
        debugMenu.build();
    }
}
