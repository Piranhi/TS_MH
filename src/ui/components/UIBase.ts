import { GameEvents } from "@/core/EventBus";
import { unbindAll, bindEvent } from "@/shared/utils/busUtils";

export class UIBase {
	public element!: HTMLElement;
	protected eventBindings: [keyof GameEvents, Function][] = [];
	protected domEventBindings: [string, EventListenerOrEventListenerObject][] = [];

	protected destroyed = false;

	protected onMouseEnter: ((e: MouseEvent) => void) | null = null;
	protected onMouseLeave: ((e: MouseEvent) => void) | null = null;
	protected onClick: ((e: MouseEvent) => void) | null = null;
	protected dragStart: ((e: DragEvent) => void) | null = null;
	protected dragOver: ((e: DragEvent) => void) | null = null;
	protected dragLeave: ((e: DragEvent) => void) | null = null;
	protected drop: ((e: DragEvent) => void) | null = null;

	// ------------ HELPERS ---------------

	destroy() {
		if (this.destroyed) return;
		this.destroyed = true;
		unbindAll(this.eventBindings);
		// Remove all DOM bindings
		for (const [type, handler] of this.domEventBindings) {
			this.element.removeEventListener(type, handler);
		}
		this.domEventBindings = [];
		this.detach();
	}

	protected bindDomEvent(type: string, handler: EventListener) {
		this.element.addEventListener(type, handler);
		this.domEventBindings.push([type, handler]);
	}

	attachTo(parent: HTMLElement) {
		this.detach();
		parent.appendChild(this.element);
	}
	detach() {
		if (this.element?.parentElement) {
			this.element.parentElement.removeChild(this.element);
		}
	}

	showComponent() {
		this.element.style.display = "";
	}

	hideComponent() {
		this.element.style = "none";
	}

	setVisibleComponent(visible: boolean) {
		this.element.style.display = visible ? "" : "none";
	}

	// Query Selector
	protected $(selector: string): HTMLElement {
		const el = this.element.querySelector<HTMLElement>(selector);
		if (!el) throw new Error(`Element not found: ${selector}`);
		return el;
	}

	protected byId(id: string): HTMLElement {
		const el = this.element.querySelector<HTMLElement>(`#${id}`);
		if (!el) throw new Error(`Element with id "${id}" not found`);
		return el;
	}

	protected getById(id: string): HTMLElement {
		const el = document.getElementById(id);
		if (!el) throw new Error(`Element with id "${id}" not found`);
		return el;
	}
}
