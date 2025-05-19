import { Player } from "../models/player";
import { engine } from "./GameEngine";
import { GameScreen } from "../ui/Screens/gameScreen";
import { ScreenManager } from "./ScreenManager";
import { SidebarDisplay } from "../ui/components/SidebarDisplay";
import { ScreenName } from "@/shared/ui-types";
import { HeaderDisplay } from "../ui/components/HeaderDisplay";
import { PlayerbarDisplay } from "../ui/components/PlayerBarDisplay";
import { HuntManager } from "../features/hunt/HuntManager";
import { screenFactories } from "./screenFactories";
import { DebugMenu } from "@/ui/components/Debug-Menu";
import { StatsManager } from "@/models/StatsManager";
import { bus } from "./EventBus";
import { initGameData } from "./gameData";
import { saveManager } from "./SaveManager";
import { InventoryManager } from "@/features/inventory/InventoryManager";
import { SettlementManager } from "@/features/settlement/SettlementManager";
import { TrainedStatManager } from "@/models/TrainedStatManager";

export class GameApp {
	/* ---------- readonly fields ---------- */
	private readonly screenManager = new ScreenManager();
	private readonly gameScreens = new Map<ScreenName, GameScreen>();
	private readonly root: HTMLElement;

	/* ---------- DOM containers ---------- */
	private container = document.getElementById("game-area")!;
	private sidebar!: SidebarDisplay;
	private header!: HeaderDisplay;
	private playerBar!: PlayerbarDisplay;

	/* ---------- game state ---------- */
	private huntManager!: HuntManager;
	private inventoryManager!: InventoryManager;
	private settlementManager!: SettlementManager;
	private trainedStatManager!: TrainedStatManager;

	constructor(root: HTMLElement) {
		this.root = root;
		const maybeArea = root.querySelector<HTMLElement>("#game-area");
		if (!maybeArea) throw new Error("#game-area not found");
		this.container = maybeArea;
	}

	async init(home: ScreenName): Promise<void> {
		// --- CORE: Construct all game systems (before player/game state loads)
		// --- GAME DATA: Load game state (from save or new)
		// --- UI: Setup components, screens, and hooks
		// --- FINALIZE: Signal game ready, start engine/game loop
		// CORE
		await this.instantiateCore();
		this.registerCoreSystems();
		bus.emit("game:init");

		// GAME LOADED/NEW GAME
		if (!saveManager.loadAll()) {
			// TODO - Try and save as much game data as possible.
			saveManager.clearSaves();
			bus.emit("game:newGame");
		}
		this.buildUI();
		this.registerScreens();
		this.mountScreens();
		await this.screenManager.show(home);

		// GAME READY
		bus.emit("game:gameReady");

		this.initUI();
		engine.start();
		this.buildDebugMenu();
		bus.on("game:prestigePrep", () => this.handlePrestigePrep());
		bus.on("game:prestige", () => this.handlePrestige());
	}

	private registerCoreSystems() {
		// Register systems for save/load
		this.inventoryManager = new InventoryManager();
		this.settlementManager = new SettlementManager();
		this.trainedStatManager = new TrainedStatManager();
		this.huntManager = new HuntManager();
		Player.initSingleton({
			inventoryManager: this.inventoryManager,
			settlementManager: this.settlementManager,
			trainedStatsManager: this.trainedStatManager,
			huntManager: this.huntManager,
		});
		saveManager.register("player", Player.getInstance());
		saveManager.register("inventory", this.inventoryManager);
		saveManager.register("trainedManager", this.trainedStatManager);
		saveManager.register("settlement", this.settlementManager);
		saveManager.register("huntManager", this.huntManager);
		saveManager.register("statsManager", StatsManager.instance);
	}

	private handlePrestigePrep() {
		console.log("handling prestige");
		saveManager.saveAll();
		Player.getInstance().destroy();
		this.screenManager.destroyAll();
		this.gameScreens.clear();
		this.trainedStatManager = new TrainedStatManager();
		this.huntManager = new HuntManager();
		saveManager.updateRegister("huntManager", this.huntManager);
		saveManager.updateRegister("trainedManager", this.trainedStatManager);
		Player.getInstance().prestigeReset({ huntManager: this.huntManager, trainedStatsManager: this.trainedStatManager });
	}

	private handlePrestige() {
		this.registerScreens();
		this.mountScreens();
		this.screenManager.show("settlement");
	}

	/* ---------- private helpers ---------- */
	private async instantiateCore() {
		initGameData(); // Load Specs
	}

	private buildUI() {
		this.sidebar = new SidebarDisplay((name) => this.screenManager.show(name));
		this.header = new HeaderDisplay(this.root.querySelector("#header")!);

		/* Each component gets its own build so they control their markup */
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
			this.screenManager.register(name as ScreenName, screen);
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
