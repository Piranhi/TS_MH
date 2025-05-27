// progressBar.ts
import { UIBase } from "./UIBase";

export interface ProgressBarOptions {
	/**
	 * The container into which the cloned template will be appended.
	 * Must be an HTMLElement (e.g. a <div> or <li> you’ve already selected).
	 */
	container: HTMLElement;

	/**
	 * The ID of your <template> element:
	 * <template id="progress-bar-template">…</template>
	 */
	templateId?: string;

	/** Starting “current” value; defaults to 0 */
	initialValue?: number;

	/** Starting “max”   value; defaults to 100 */
	maxValue?: number;
}

export class ProgressBarSimple extends UIBase {
	private root: HTMLElement;
	private fillEl: HTMLElement;
	private current = 0;
	private max = 100;

	constructor(options: ProgressBarOptions) {
		super();
		// Clone + append the template, capturing its root element
		this.root = this.cloneTemplate(options.templateId ? options.templateId : "progress-bar-template", options.container);

		// Grab the bar-fill element
		this.fillEl = this.root.querySelector(".mh-progress__fill")!;
		this.fillEl.classList.add("mh-progress--generic");

		// Apply any overrides
		if (options.maxValue !== undefined) this.max = options.maxValue;
		if (options.initialValue !== undefined) this.current = options.initialValue;

		// Render initial state
		this.updateFill();
	}

	/** Clones the <template> and appends it to the container */
	private cloneTemplate(templateId: string, container: HTMLElement): HTMLElement {
		const tpl = document.getElementById(templateId)! as HTMLTemplateElement;
		const root = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;
		container.append(root);
		return root;
	}

	/** Set a new “current” value (clamped 0–max) and redraws the fill */
	public setValue(value: number): void {
		this.current = Math.min(Math.max(value, 0), this.max);
		this.updateFill();
	}

	/** Change the “max” value and re-apply the current fill */
	public setMax(max: number): void {
		this.max = max;
		this.setValue(this.current);
	}

	/** Computes percentage and writes it to the fill’s width */
	private updateFill(): void {
		const pct = this.max > 0 ? (this.current / this.max) * 100 : 0;
		this.fillEl.style.width = `${pct}%`;
	}

	/** Clean up the DOM when you no longer need this bar */
	public destroy(): void {
		this.root.remove();
	}
}
