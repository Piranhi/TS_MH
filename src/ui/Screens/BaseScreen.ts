import { GameScreen } from "./gameScreen";
import { ScreenName } from "@/shared/ui-types";
import { UIBase } from "../components/UIBase";

export abstract class BaseScreen extends UIBase implements GameScreen {
	abstract readonly screenName: ScreenName;
	public element: HTMLElement;
	private unlocked = false;
	private _isActive = false;

	constructor() {
		super();
		this.element = document.createElement("div");
		this.element.classList.add("screen");
	}

	abstract init(): void;
	show(): void {
		this._isActive = true;
		this.onShow();
	}
	hide(): void {
		this._isActive = false;
		this.onHide();
	}

	protected abstract onShow(): void;
	protected abstract onHide(): void;

	get isActive(): boolean {
		return this._isActive;
	}

	//handleTick?(deltaMs: number): void;
	protected handleTick?(dt: number) {
		if (!this.isFeatureActive() || !this._isActive) return;
	}

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
