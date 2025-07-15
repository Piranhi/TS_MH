// UIButton.ts

import { UIBase } from "./UIBase";

export interface UIButtonOptions {
	/** Text to display inside the button */
	text?: string;
	/** Click callback */
	onClick?: (ev: MouseEvent) => void;
	/** Optional CSS class for styling variants */
	id?: string;
	className?: string;
	disabled?: boolean;
	tooltip?: string;
	size?: "small" | "medium" | "large";
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
		this.el.id = options.id ?? "";
		switch (options.size) {
			case "small":
				this.el.classList.add("ui-button-small");
				break;
			case "medium":
				this.el.classList.add("ui-button-medium");
				break;
			case "large":
				this.el.classList.add("ui-button-large");
				break;
			default:
				this.el.classList.add("ui-button");
				break;
		}
		if (options.className) {
			const classes = Array.isArray(options.className)
				? options.className // already an array
				: options.className.trim().split(/\s+/); // split "a b" → ["a","b"]

			this.el.classList.add(...classes); // ✅ pass each token separately
		}
		//this.el.classList.add(!options.className ? "ui-button" : options.className);
		//this.el.classList.add("ui-button");

		this.el.textContent = options.text ?? "Button";

		// 2️⃣ Append to the container
		parent.appendChild(this.el);

		// 3️⃣ Wire up click via UIBase helper (auto-deregisters on destroy)
		if (options.onClick) {
			this.bindDomEvent(this.el, "click", options.onClick as EventListener);
		}
		this.setState(options.disabled ? "disabled" : "enabled");
	}

	public setState(state: "disabled" | "enabled") {
		if (state === "disabled") {
			this.el.disabled = true;
		} else {
			this.el.disabled = false;
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
