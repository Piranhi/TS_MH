import { Player } from "./player";
import { engine } from "./GameEngine";
import { GameScreen } from "./Screens/gameScreen";
import { ScreenManager } from "./shared/utils/ScreenManager";
import { Sidebar } from "./ui/Sidebar";
import "./ui/Header";
import { ScreenName } from "./shared/types";
import { UIHeader } from "./ui/Header";
import { Playerbar } from "./ui/PlayerBar";
import { HuntManager } from "./features/hunt/HuntManager";
import { PlayerCharacter } from "./features/Characters/PlayerCharacter";
import { screenFactories } from "./shared/utils/screenFactories";


export class GameApp {
	/* ---------- readonly fields ---------- */
	private readonly screenManager = new ScreenManager();
	private readonly gameScreens = new Map<ScreenName, GameScreen>();
	private readonly root: HTMLElement;

	/* ---------- DOM containers ---------- */
	private container = document.getElementById("game-area")!;
	private sidebar!: Sidebar;
	private header!: UIHeader;
	private playerBar!: Playerbar;

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
	}

	/* ---------- private helpers ---------- */
	private async instantiateCore() {
		await Player.getInstance().init();
		this.huntManager = new HuntManager(Player.getInstance().getPlayerCharacter());
	}

	private buildUI() {
		this.sidebar = new Sidebar(this.root.querySelector("#sidebar")!, Object.keys(screenFactories) as ScreenName[], (name) =>
			this.screenManager.show(name)
		);
		this.header = new UIHeader(this.root.querySelector("#header")!);
		this.playerBar = new Playerbar(this.root.querySelector("#player-bar")!);

		/* Each component gets its own build so they control their markup */
		this.sidebar.build();
		this.header.build();
		this.playerBar.build();
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
