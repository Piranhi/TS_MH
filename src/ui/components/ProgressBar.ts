// progressBar.ts
import { UIBase } from "./UIBase";

export interface ProgressBarOptions {
	/**
	 * The container into which the progress bar will be appended.
	 * Must be an HTMLElement (e.g. a <div> or <li> you've already selected).
	 */
	container: HTMLElement;

	/** Optional label text to display above the bar */
	label?: string;

	/** Show the label above the bar (default: false) */
	showLabel?: boolean;

	/** Starting "current" value; defaults to 0 */
	initialValue?: number;

	/** Starting "max"   value; defaults to 100 */
	maxValue?: number;

	/** Enable smooth fill transition */
	smooth?: boolean;

	color?: "red" | "green" | "blue" | "yellow" | "purple";
}

export class ProgressBar extends UIBase {
	private root: HTMLElement;
	private fillEl: HTMLElement;
	private labelEl?: HTMLElement;
	private current = 0;
	private max = 100;

	constructor(options: ProgressBarOptions) {
		super();

		// Create root container
		this.root = document.createElement("div");
		this.root.classList.add("mh-progress-container");

		// Create progress bar
		const bar = document.createElement("div");
		bar.classList.add("mh-progress");
		bar.setAttribute("role", "progressbar");

		// Create fill
		this.fillEl = document.createElement("span");
		this.fillEl.classList.add("mh-progress__fill");
		this.fillEl.classList.add("mh-progress--generic");
		if (options.smooth) {
			this.fillEl.classList.add("mh-progress--smooth");
		}
		switch (options.color) {
			case "red":
				this.fillEl.classList.add("mh-progress--red");
				break;
			case "green":
				this.fillEl.classList.add("mh-progress--green");
				break;
			case "blue":
				this.fillEl.classList.add("mh-progress--blue");
				break;
			case "yellow":
				this.fillEl.classList.add("mh-progress--yellow");
				break;
			case "purple":
				this.fillEl.classList.add("mh-progress--purple");
				break;
			default:
				this.fillEl.classList.add("mh-progress--generic");
		}
		bar.appendChild(this.fillEl);

		// Optionally add label (as a child of bar, after fill)
		if (options.showLabel) {
			this.labelEl = document.createElement("div");
			this.labelEl.classList.add("mh-progress-label");
			this.labelEl.textContent = options.label ?? "";
			bar.appendChild(this.labelEl);
		}
		this.root.appendChild(bar);

		// Apply any overrides
		if (options.maxValue !== undefined) this.max = options.maxValue;
		if (options.initialValue !== undefined) this.current = options.initialValue;

		// Render initial state
		this.updateFill();

		// Append to container
		options.container.appendChild(this.root);
		this.element = this.root;
	}

	/** Set a new label (if label is enabled) */
	public setLabel(label: string): void {
		if (this.labelEl) {
			this.labelEl.textContent = label;
		}
	}

	/** Set a new "current" value (clamped 0–max) and redraws the fill */
	public setValue(value: number): void {
		this.current = Math.min(Math.max(value, 0), this.max);
		this.updateFill();
	}

	/** Change the "max" value and re-apply the current fill */
	public setMax(max: number): void {
		this.max = max;
		this.setValue(this.current);
	}

	/** Computes percentage and writes it to the fill's width */
	private updateFill(): void {
		const pct = this.max > 0 ? (this.current / this.max) * 100 : 0;
		this.fillEl.style.width = `${pct}%`;
	}

	/** Clean up the DOM when you no longer need this bar */
	public destroy(): void {
		this.root.remove();
	}
}
