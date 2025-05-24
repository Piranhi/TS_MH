// ===================================================
// GameApp.ts - Simplified bootstrapper
// ===================================================
import { GameContext } from "./GameContext";
import { GameServices } from "./GameServices";
import { Player } from "./Player";
import { engine } from "./GameEngine";
import { ScreenManager } from "./ScreenManager";
import { SidebarDisplay } from "../ui/components/SidebarDisplay";
import { ScreenName } from "@/shared/ui-types";
import { HeaderDisplay } from "../ui/components/HeaderDisplay";
import { DebugMenu } from "@/ui/components/Debug-Menu";
import { bus } from "./EventBus";
import { initGameData } from "./gameData";
import { screenFactories } from "./screenFactories";
import { GameScreen } from "@/ui/Screens/gameScreen";

export class GameApp {
	private readonly root: HTMLElement;
	private container: HTMLElement;
	private context!: GameContext;
	private services!: GameServices;

	// UI Components
	private sidebar!: SidebarDisplay;
	private header!: HeaderDisplay;
	private gameScreens = new Map<ScreenName, GameScreen>();

	constructor(root: HTMLElement) {
		this.root = root;
		const maybeArea = root.querySelector<HTMLElement>("#game-area");
		if (!maybeArea) throw new Error("#game-area not found");
		this.container = maybeArea;
	}

	async init(home: ScreenName): Promise<void> {
		// 1. Initialize game data
		initGameData();

		// 2. Initialize services
		this.services = GameServices.getInstance();

		// 3. Initialize player
		const player = Player.initSingleton({
			inventoryManager: this.services.inventoryManager,
			settlementManager: this.services.settlementManager,
		});

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
			this.context.startNewRun(player.getPrestigeState());
		} else {
			// Resume existing run
			const prestigeState = player.getPrestigeState();
			this.context.startNewRun(prestigeState);
		}

		// 8. Build UI
		this.buildUI();
		this.registerScreens();
		this.mountScreens();
		await this.context.screens.show(home);

		// 9. Start game
		bus.emit("game:gameReady");
		this.initUI();
		engine.start();
		this.buildDebugMenu();

		// 10. Setup prestige handlers
		this.setupPrestigeHandlers();
	}

	private registerPersistentSystems() {
		const saveManager = this.services.saveManager;
		saveManager.register("player", this.context.player);
		saveManager.register("inventory", this.services.inventoryManager);
		saveManager.register("settlement", this.services.settlementManager);
		saveManager.register("milestonesManager", this.services.milestoneManager);
		saveManager.register("statsManager", this.services.statsManager);
	}

	private setupPrestigeHandlers() {
		bus.on("game:prestigePrep", () => this.handlePrestigePrep());
		bus.on("game:prestige", () => this.handlePrestige());
	}

	private handlePrestigePrep() {
		console.log("Preparing for prestige...");

		// Save current state
		this.services.saveManager.saveAll();

		// End current run
		this.context.endCurrentRun();

		// Clean up UI
		this.context.screens.destroyAll();
		this.gameScreens.clear();

		// Reset player for new run
		this.context.player.prestigeReset();
	}

	private handlePrestige() {
		console.log("Starting new prestige run...");

		// Start new run with updated prestige state
		const prestigeState = this.context.player.getPrestigeState();
		this.context.startNewRun(prestigeState);

		// Rebuild UI
		this.registerScreens();
		this.mountScreens();
		this.context.screens.show("settlement");
	}

	private buildUI() {
		this.sidebar = new SidebarDisplay((name) => this.context.screens.show(name));
		this.header = new HeaderDisplay(this.root.querySelector("#header")!);

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

	private registerScreens() {
		Object.entries(screenFactories).forEach(([name, factory]) => {
			const screen = factory();
			this.context.screens.register(name as ScreenName, screen);
			this.gameScreens.set(name as ScreenName, screen);
		});
	}

	private mountScreens() {
		this.gameScreens.forEach((screen) => {
			this.container.append(screen.element);
			screen.init();
			screen.element.classList.remove("active");
		});
	}
}
