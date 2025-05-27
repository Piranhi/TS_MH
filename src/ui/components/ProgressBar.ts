import { UIBase } from "./UIBase";
import { MAX_BARS_PER_SECOND } from "@/balance/GameBalance";

export interface ProgressBarOptions {
	/**
	 * The container into which the cloned template will be appended.
	 * Must be an HTMLElement (e.g. a <div> or <li> you've already selected).
	 */
	container: HTMLElement;

	/**
	 * The ID of your <template> element:
	 * <template id="progress-bar-template">…</template>
	 */
	templateId?: string;

	/** Starting "current" value; defaults to 0 */
	initialValue?: number;

	/** Starting "max" value; defaults to 100 */
	maxValue?: number;
}

export class ProgressBar extends UIBase {
	private root: HTMLElement;
	private fillEl: HTMLElement;
	private current = 0;
	private max = 100;
	private currentEfficiencyRate = 0;
	private isSolid = false;

	// Values for switching display mode
	private allocationCurrent = 0;
	private allocationMax = 100;

	// Threshold for solid bar - 0.5 bars/second means solid (30 points for 60 threshold)
	private readonly SOLID_THRESHOLD = 0.5;

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
		this.updateDisplay();
	}

	/** Clones the <template> and appends it to the container */
	private cloneTemplate(templateId: string, container: HTMLElement): HTMLElement {
		const tpl = document.getElementById(templateId)! as HTMLTemplateElement;
		const root = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;
		container.append(root);
		return root;
	}

	/** Set a new "current" value (clamped 0–max) and redraws the fill */
	public setValue(value: number): void {
		this.current = Math.min(Math.max(value, 0), this.max);
		this.updateDisplay();
	}

	/** Change the "max" value and re-apply the current fill */
	public setMax(max: number): void {
		this.max = max;
		this.setValue(this.current);
	}

	/** Set the efficiency rate for visual styling */
	public setEfficiencyRate(barsPerSecond: number): void {
		this.currentEfficiencyRate = barsPerSecond;
		this.updateDisplay();
	}

	/** Set allocation values for high-efficiency display */
	public setAllocationValues(current: number, max: number): void {
		this.allocationCurrent = current;
		this.allocationMax = max;
		this.updateDisplay();
	}

	/** Update the progress bar display */
	private updateDisplay(): void {
		// Determine if should be solid (>= 0.5 bars/second)
		const shouldBeSolid = this.currentEfficiencyRate >= this.SOLID_THRESHOLD;

		// Choose which values to display based on efficiency
		let displayCurrent, displayMax, fillPercent;

		if (shouldBeSolid) {
			// High efficiency: Show allocation progress (e.g., 304/600)
			displayCurrent = this.allocationCurrent;
			displayMax = this.allocationMax;
			fillPercent = displayMax > 0 ? (displayCurrent / displayMax) * 100 : 0;
		} else {
			// Low efficiency: Show XP progress (e.g., 54/60)
			displayCurrent = this.current;
			displayMax = this.max;
			fillPercent = displayMax > 0 ? (displayCurrent / displayMax) * 100 : 0;
		}

		// Update the fill width
		this.fillEl.style.width = `${fillPercent}%`;

		// Calculate efficiency percentage for the text display
		const efficiencyPct = Math.min((this.currentEfficiencyRate / MAX_BARS_PER_SECOND) * 100, 100);

		// Update visual state if changed
		if (shouldBeSolid !== this.isSolid) {
			this.isSolid = shouldBeSolid;
			this.updateVisualState();
		}

		// Update efficiency display
		this.updateEfficiencyDisplay(efficiencyPct);
	}

	/** Update visual state (solid vs animated) */
	private updateVisualState(): void {
		// Remove all state classes first
		this.fillEl.classList.remove("mh-progress--solid", "mh-progress--animated", "mh-progress--high-efficiency");

		if (this.isSolid) {
			this.fillEl.classList.add("mh-progress--solid", "mh-progress--high-efficiency");
		} else {
			this.fillEl.classList.add("mh-progress--animated");
		}
	}

	/** Update efficiency percentage display */
	private updateEfficiencyDisplay(efficiencyPct: number): void {
		if (efficiencyPct > 0) {
			this.fillEl.setAttribute("data-efficiency", `${Math.round(efficiencyPct)}%`);
		} else {
			this.fillEl.removeAttribute("data-efficiency");
		}
	}

	/** Get current fill rate for external use */
	public getFillRate(): number {
		return this.currentEfficiencyRate;
	}

	/** Get efficiency percentage for external use */
	public getEfficiencyPercentage(): number {
		return Math.min((this.currentEfficiencyRate / MAX_BARS_PER_SECOND) * 100, 100);
	}

	/** Check if this progress bar is at maximum efficiency */
	public isMaxEfficiency(): boolean {
		return this.currentEfficiencyRate >= MAX_BARS_PER_SECOND;
	}

	/** Clean up the DOM when you no longer need this bar */
	public destroy(): void {
		this.root.remove();
	}
}
