import { bus, EventKey, GameEvents } from "../EventBus";

type NumberEventsKey = { [K in EventKey]: GameEvents[K] extends number ? K : never }[EventKey];

export class UIStatNumber<K extends NumberEventsKey> {
	constructor(private label: string, private eventKey: K, private container: HTMLElement) {}

	public init() {
		const tpl = document.getElementById("stat-num-template")! as HTMLTemplateElement;
		const li = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;

		const labelEl = li.querySelector(".label")!;
		const valueEl = li.querySelector(".value")!;
		labelEl.textContent = this.label;
		valueEl.textContent = "1";
		this.container.append(li);

		bus.on<K>(this.eventKey, (payload) => {
			valueEl.textContent = payload.toString();
		}); 
	}
}

