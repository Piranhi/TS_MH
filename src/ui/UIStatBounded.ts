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
		fill.style.setProperty("--value", String(0)); // or bar.style…

		bus.on<K>(this.eventKey, (payload:Bounded) => {
			valueEl.textContent = `${payload.current.toString()} / ${payload.max.toString()}`;
			const percentage = (payload.current / payload.max) * 100;
			fill.style.setProperty("--value", String(percentage)); // or bar.style…
			valueEl.textContent = `${Math.floor(payload.current)} / ${Math.floor(payload.max)}`;
		});
	}
}
