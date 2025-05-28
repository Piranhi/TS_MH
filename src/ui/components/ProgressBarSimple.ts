// progressBar.ts
import { BigNumber } from "@/models/utils/BigNumber";
import { UIBase } from "./UIBase";

export interface ProgressBarOptions {
	container: HTMLElement;
	templateId?: string;
	/** Starting "current" value; defaults to 0 */
	initialValue?: number | BigNumber;
	/** Starting "max" value; defaults to 100 */
	maxValue?: number | BigNumber;
}

export class ProgressBarSimple extends UIBase {
	private root: HTMLElement;
	private fillEl: HTMLElement;
	private current: BigNumber;
	private max: BigNumber;

	constructor(options: ProgressBarOptions) {
		super();
		// Clone + append the template, capturing its root element
		this.root = this.cloneTemplate(options.templateId ? options.templateId : "progress-bar-template", options.container);

		// Grab the bar-fill element
		this.fillEl = this.root.querySelector(".mh-progress__fill")!;
		this.fillEl.classList.add("mh-progress--generic");

		// Convert everything to BigNumber at construction time
		this.max = this.toBigNumber(options.maxValue ?? 100);
		this.current = this.toBigNumber(options.initialValue ?? 0);

		// Render initial state
		this.updateFill();
	}

	/** Helper to convert number | BigNumber to BigNumber */
	private toBigNumber(value: number | BigNumber): BigNumber {
		return value instanceof BigNumber ? value : new BigNumber(value);
	}

	/** Clones the <template> and appends it to the container */
	private cloneTemplate(templateId: string, container: HTMLElement): HTMLElement {
		const tpl = document.getElementById(templateId)! as HTMLTemplateElement;
		const root = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;
		container.append(root);
		return root;
	}

	/** Set a new "current" value (clamped 0–max) and redraws the fill */
	public setValue(value: number | BigNumber): void {
		const bigValue = this.toBigNumber(value);
		// Clamp between 0 and max using BigNumber methods
		const zero = new BigNumber(0);
		this.current = BigNumber.min(BigNumber.max(bigValue, zero), this.max);
		this.updateFill();
	}

	/** Change the "max" value and re-apply the current fill */
	public setMax(max: number | BigNumber): void {
		this.max = this.toBigNumber(max);
		this.setValue(this.current); // Re-clamp current value against new max
	}

	/** Computes percentage and writes it to the fill's width */
	private updateFill(): void {
		// Only convert to number at display time for percentage calculation
		const pct = this.max.eq(0) ? 0 : this.current.div(this.max).toNumber() * 100;
		this.fillEl.style.width = `${pct}%`;
	}

	/** Get current value as BigNumber */
	public getValue(): BigNumber {
		return this.current;
	}

	/** Get max value as BigNumber */
	public getMax(): BigNumber {
		return this.max;
	}

	/** Get current percentage as number (0-100) */
	public getPercentage(): number {
		return this.max.eq(0) ? 0 : this.current.div(this.max).toNumber() * 100;
	}

	/** Check if progress bar is full */
	public isFull(): boolean {
		return this.current.gte(this.max);
	}

	/** Check if progress bar is empty */
	public isEmpty(): boolean {
		return this.current.eq(0);
	}

	/** Clean up the DOM when you no longer need this bar */
	public destroy(): void {
		this.root.remove();
	}
}
