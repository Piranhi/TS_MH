import { Bounded } from "../domain/value-objects/Bounded";
import { bus, EventKey, GameEvents } from "../EventBus";

type BoundedEventsKey = { [K in EventKey]: GameEvents[K] extends Bounded ? K : never }[EventKey];

export class UIStatBounded<K extends BoundedEventsKey> {
	constructor(private label: string, private eventKey: K, private container: HTMLElement) {}

	public init() {
		const tpl = document.getElementById("stat-bar-template")! as HTMLTemplateElement;
		const li = tpl.content.firstElementChild!.cloneNode(true) as HTMLLIElement;

		const bar = li.querySelector(".mh-progress") as HTMLElement;
		const fill = li.querySelector(".mh-progress__fill") as HTMLElement;
		const labelEl = li.querySelector(".label")!;
		const valueEl = li.querySelector(".value")!;

		labelEl.textContent = this.label;
		valueEl.textContent = "0 / 100";
		bar.classList.add("mh-progress--generic");

		this.container.append(li);
		fill.style.setProperty("--value", String(0));

		type Payload = Bounded | {bounded: Bounded; extra: number};

		bus.on<K>(this.eventKey, (payload:Payload) => {
			// Grab bounded and number based on signature used. 
			const bounded: Bounded =
			payload instanceof Bounded ? payload : payload.bounded;
		  const extra: number =
			payload instanceof Bounded ? 0 : payload.extra ?? 0;

			const current = (bounded.current ?? 0) - extra;
			const max = bounded.max ?? 0;

			valueEl.textContent = `${Math.floor(current)} / ${Math.floor(max)}`;
			const percentage = max > 0?  (current / max) * 100 : 0
			fill.style.setProperty("--value", String(percentage));
		});
	}
}
