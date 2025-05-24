import { GameScreen } from "../ui/Screens/gameScreen";
import { ScreenName } from "../shared/ui-types";
import { bus } from "./EventBus";

type Loader<T> = () => Promise<T>;

export class ScreenManager<Name extends ScreenName = ScreenName> {
	private lastScreen: Name = "settlement";
	private current?: GameScreen | null;
	private registry = new Map<Name, GameScreen>();

	/** Register either an already-constructed Screen, or a loader that returns one */
	register(name: Name, screen: GameScreen) {
		this.registry.set(name, screen);
	}

	destroyAll() {
		this.registry.forEach((s) => s.destroy());
		this.registry.clear();
		this.current = null;
	}

	/** Switch to a screen by name */
	async show(name: Name) {
		// Hide the current
		if (this.current) {
			this.current.hide();
			this.current.element.classList.remove("active");
		}

		let screen = this.registry.get(this.current ? name : this.lastScreen);
		if (!screen) throw new Error(`No screen: ${name}`);

		// Init once
		if (!screen.element.isConnected) {
			document.getElementById("game-area")!.append(screen.element);
			screen.init();
		}

		// Show
		screen.element.classList.add("active");
		screen.show();
		this.current = screen;
		this.lastScreen = name;
		bus.emit("ui:screenChanged", name);
	}
}
