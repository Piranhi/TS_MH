import { GameScreen } from "./gameScreen";
import { ScreenName } from "@/shared/ui-types";
import { UIBase } from "../components/UIBase";

export abstract class BaseScreen extends UIBase implements GameScreen {
	abstract readonly screenName: ScreenName;
	public element: HTMLElement;


	constructor() {
		super();
		this.element = document.createElement("div");
		this.element.classList.add("screen");
	}

	abstract init(): void;
	abstract show(): void;
	abstract hide(): void;
	update?(deltaMs: number): void;

	// Add HTML into page.
	protected addMarkuptoPage(markup: string): HTMLElement {
		const tpl = document.createElement("template");
		tpl.innerHTML = markup.trim();
		const element = tpl.content.firstElementChild as HTMLElement | null;
		if (!element) {
			throw new Error("Settlement template is empty");
		}
		this.element.append(element);
		return element;
	}
}
