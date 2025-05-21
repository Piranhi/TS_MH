import { GameEvents } from "@/core/EventBus";
import { unbindAll, bindEvent } from "@/shared/utils/busUtils";

type DomBinding = [HTMLElement, string, EventListenerOrEventListenerObject];

export class UIBase {
	public element!: HTMLElement;
	protected eventBindings: [keyof GameEvents, Function][] = [];
	protected domEventBindings: DomBinding[] = [];

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
		for (const [el, type, handler] of this.domEventBindings) {
			el.removeEventListener(type, handler);
		}
		this.domEventBindings = [];
		const els = new Set<HTMLElement>([this.element!]);
		this.element!.querySelectorAll<HTMLElement>(`*`).forEach((e) => els.add(e));
		// Cancel anything whose target is in our set
		document.getAnimations().forEach((anim) => {
			const target = anim.effect && (anim.effect as any).target;
			if (target instanceof Node && els.has(target as HTMLElement)) {
				anim.cancel();
			}
		});

		// 2) Strip out any lingering CSS transitions/animations so UA can GC
		els.forEach((el) => {
			el.style.animation = "none";
			el.style.transition = "none";
		});

		this.detach();
	}

	// Bind Dom elements to events (click, etc)
	protected bindDomEvent(
		elementOrType: HTMLElement | string,
		typeOrHandler: string | EventListenerOrEventListenerObject,
		maybeHandler?: EventListenerOrEventListenerObject
	) {
		let el: HTMLElement;
		let type: string;
		let handler: EventListenerOrEventListenerObject;

		if (typeof elementOrType === "string") {
			// two-arg form: (type, handler)
			el = this.element;
			type = elementOrType;
			handler = typeOrHandler as EventListenerOrEventListenerObject;
		} else {
			// three-arg form: (el, type, handler)
			el = elementOrType;
			type = typeOrHandler as string;
			handler = maybeHandler!;
		}

		el.addEventListener(type, handler);
		this.domEventBindings.push([el, type, handler]);
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
