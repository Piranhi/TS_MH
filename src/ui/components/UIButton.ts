// UIButton.ts

import { UIBase } from "./UIBase";

export interface UIButtonOptions {
	/** Text to display inside the button */
	text?: string;
	/** Click callback */
	onClick?: (ev: MouseEvent) => void;
	/** Optional CSS class for styling variants */
	className?: string;
}

export class UIButton extends UIBase {
	public readonly el: HTMLButtonElement;

	constructor(
		/** Parent element or container to which this button will be appended */
		parent: HTMLElement,
		/** Configuration */
		options: UIButtonOptions = {}
	) {
		super();
		// 1️⃣ Create and configure the DOM element
		this.el = document.createElement("button");
		this.element = this.el;
		this.el.classList.add("ui-button");
		if (options.className) {
			this.el.classList.add(options.className);
		}
		this.el.textContent = options.text ?? "Button";

		// 2️⃣ Append to the container
		parent.appendChild(this.el);

		// 3️⃣ Wire up click via UIBase helper (auto-deregisters on destroy)
		if (options.onClick) {
			this.bindDomEvent(this.el, "click", options.onClick as EventListener);
		}
	}

	/**
	 * Clean up: remove from DOM and unregister all listeners
	 * (UIBase.destroy() takes care of listeners you registered via registerListener)
	 */
	public override destroy() {
		super.destroy(); // unregisters listeners
		this.el.remove(); // detach from DOM
	}
}
