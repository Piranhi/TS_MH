import { GameScreen } from "../ui/Screens/gameScreen";
import { ScreenName } from "../shared/ui-types";
import { bus } from "./EventBus";

// Import game screens
import { SettlementScreen } from "../ui/Screens/SettlementScreen";
import { HuntScreen } from "../ui/Screens/HuntScreen";
import { BlacksmithScreen } from "../ui/Screens/BlacksmithScreen";
import { CharacterScreen } from "../ui/Screens/CharacterScreen";
import { InventoryScreen } from "../ui/Screens/InventoryScreen";
import { ResearchScreen } from "../ui/Screens/ResearchScreen";
import { TrainScreen } from "../ui/Screens/TrainScreen";
import { OutpostsScreen } from "@/ui/Screens/OutpostsScreen";
import { LibraryScreen } from "@/ui/Screens/LibraryScreen";
import { MarketScreen } from "@/ui/Screens/MarketScreen";
import { MineScreen } from "@/ui/Screens/MineScreen";
import { GuildHallScreen } from "@/ui/Screens/GuildHallScreen";

// Screen Factory

export class ScreenManager<Name extends ScreenName = ScreenName> {
	private screenFactories: Record<ScreenName, () => GameScreen> = {
		settlement: () => new SettlementScreen(),
		blacksmith: () => new BlacksmithScreen(),
		library: () => new LibraryScreen(),
		market: () => new MarketScreen(),
		train: () => new TrainScreen(),
		hunt: () => new HuntScreen(),
		outposts: () => new OutpostsScreen(),
		character: () => new CharacterScreen(),
		inventory: () => new InventoryScreen(),
		research: () => new ResearchScreen(),
		mine: () => new MineScreen(),
		guildHall: () => new GuildHallScreen(),
	};

	private screens = new Map<ScreenName, GameScreen>();
	private container!: HTMLElement;

	private current?: GameScreen | null;

	init(container: HTMLElement) {
		this.container = container;
		this.registerScreens();
		this.mountScreens();
		this.show("train" as Name);
	}

	private registerScreens(): void {
		// Object.keys gives us a string[], so we cast it to ScreenName[].
		(Object.keys(this.screenFactories) as ScreenName[]).forEach((name) => {
			const factory = this.screenFactories[name];
			const screen = factory();
			this.screens.set(name, screen);
		});
	}

	private mountScreens(): void {
		this.screens.forEach((screen) => {
			this.container.append(screen.element);
			screen.init();
			screen.element.classList.remove("active");
		});
	}

	destroyAll() {
		this.screens.forEach((s) => s.destroy());
		this.screens.clear();
		this.current = null;
		this.container.innerHTML = "";
	}

	/** Switch to a screen by name */
	show(name: Name) {
		// Hide the current
		if (this.current) {
			this.current.hide();
			this.current.element.classList.remove("active");
		}

		const screen = this.screens.get(name);
		if (!screen) throw new Error(`No screen: ${name}`);

		// Show
		screen.element.classList.add("active");
		screen.show();
		this.current = screen;
		//this.lastScreen = name;
		bus.emit("ui:screenChanged", name);
	}
}
