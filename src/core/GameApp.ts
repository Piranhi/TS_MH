import { Player } from "../models/player";
import { engine } from "./GameEngine";
import { GameScreen } from "../ui/Screens/gameScreen";
import { ScreenManager } from "./ScreenManager";
import { SidebarDisplay } from "../ui/components/SidebarDisplay";
import { ScreenName } from "../shared/types";
import { HeaderDisplay } from "../ui/components/HeaderDisplay";
import { PlayerbarDisplay } from "../ui/components/PlayerBarDisplay";
import { HuntManager } from "../features/hunt/HuntManager";
import { screenFactories } from "./screenFactories";
import { DebugMenu } from "@/ui/components/Debug-Menu";
import { SaveManager } from "./SaveManager";

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

	constructor(root: HTMLElement) {
		this.root = root;
		const maybeArea = root.querySelector<HTMLElement>("#game-area");
		if (!maybeArea) throw new Error("#game-area not found");
		this.container = maybeArea;
	}

	async init(home: ScreenName): Promise<void> {
		await this.instantiateCore();
		this.buildUI();
		this.registerScreens();
		this.mountScreens();

		await this.screenManager.show(home);
		engine.start();
		this.buildDebugMenu();
	}

	/* ---------- private helpers ---------- */
	private async instantiateCore() {
		await Player.getInstance().init();
		this.huntManager = new HuntManager(Player.getInstance().getPlayerCharacter());
	}

	private buildUI() {
		this.sidebar = new SidebarDisplay(this.root.querySelector("#sidebar")!, Object.keys(screenFactories) as ScreenName[], (name) =>
			this.screenManager.show(name)
		);
		this.header = new HeaderDisplay(this.root.querySelector("#header")!);

		/* Each component gets its own build so they control their markup */
		this.sidebar.build();
		this.header.build();
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
