// progressBar.ts
import { UIBase } from "./UIBase";

export interface ProgressBarOptions {
	container: HTMLElement;
	templateId?: string;
	/** Starting "current" value; defaults to 0 */
        initialValue?: number;
	/** Starting "max" value; defaults to 100 */
        maxValue?: number;
}

export class ProgressBarSimple extends UIBase {
	private root: HTMLElement;
	private fillEl: HTMLElement;
        private current: number;
        private max: number;

	constructor(options: ProgressBarOptions) {
		super();
		// Clone + append the template, capturing its root element
		this.root = this.cloneTemplate(options.templateId ? options.templateId : "progress-bar-template", options.container);

		// Grab the bar-fill element
		this.fillEl = this.root.querySelector(".mh-progress__fill")!;
		this.fillEl.classList.add("mh-progress--generic");

                this.max = options.maxValue ?? 100;
                this.current = options.initialValue ?? 0;

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

	/** Set a new "current" value (clamped 0–max) and redraws the fill */
        public setValue(value: number): void {
                const clamped = Math.max(0, Math.min(value, this.max));
                this.current = clamped;
                this.updateFill();
        }

	/** Change the "max" value and re-apply the current fill */
        public setMax(max: number): void {
                this.max = max;
                this.setValue(this.current); // Re-clamp current value against new max
        }

	/** Computes percentage and writes it to the fill's width */
	private updateFill(): void {
		// Only convert to number at display time for percentage calculation
                const pct = this.max === 0 ? 0 : (this.current / this.max) * 100;
                this.fillEl.style.width = `${pct}%`;
        }

        /** Get current value */
        public getValue(): number {
                return this.current;
        }

        /** Get max value */
        public getMax(): number {
                return this.max;
        }

	/** Get current percentage as number (0-100) */
        public getPercentage(): number {
                return this.max === 0 ? 0 : (this.current / this.max) * 100;
        }

	/** Check if progress bar is full */
        public isFull(): boolean {
                return this.current >= this.max;
        }

	/** Check if progress bar is empty */
        public isEmpty(): boolean {
                return this.current === 0;
        }

	/** Clean up the DOM when you no longer need this bar */
	public destroy(): void {
		this.root.remove();
	}
}
