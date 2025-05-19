import { bus, EventKey, GameEvents } from "@/core/EventBus";
import { UIBase } from "./UIBase";

type Elements = {
	labelEl: HTMLElement;
	valueEl: HTMLElement;
	barEl?: HTMLElement;
	fillEl?: HTMLElement;
};

export class StatDisplay<K extends EventKey> extends UIBase {
	constructor(
		private label: string,
		private eventKey: K,
		private container: HTMLElement,
		private templateId: string,
		private renderer: (payload: GameEvents[K], els: Elements) => void
	) {
		super();
	}

	public init() {
		// Clone the correct template
		const tpl = document.getElementById(this.templateId)! as HTMLTemplateElement;
		const root = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;
		this.container.append(root);

		// Grab the bits relevant to our needs
		const labelEl = root.querySelector(".label");
		const valueEl = root.querySelector(".value");
		const barEl = root.querySelector(".mh-progress");
		const fillEl = root.querySelector(".mh-progress__fill");

		if (!labelEl || !valueEl) {
			console.error(`Template ${this.templateId} missing .label or .value`);
			return;
		}

		const els: Elements = {
			labelEl: labelEl as HTMLElement,
			valueEl: valueEl as HTMLElement,
			barEl: barEl as HTMLElement | undefined,
			fillEl: fillEl as HTMLElement | undefined,
		};

		// Set static bits

		els.labelEl.textContent = this.label;
		if (els.fillEl) {
			els.fillEl.classList.add("mh-progress--generic");
			els.fillEl.style.setProperty("--value", "0");
		}

		// Subscribe once and let the renderer do the rest
		bus.on<K>(this.eventKey, (payload) => {
			this.renderer(payload, els);
		});
	}

	destroy() {
		
	}
}
