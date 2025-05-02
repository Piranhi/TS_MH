import { Bounded } from "./domain/value-objects/Bounded";

export interface GameEvents {
	"Game:UITick": number;
	"Game:GameTick": number;
	"Renown:Changed" : Bounded;
	"Resource:Changed": { gold: number };
}

export type EventKey = keyof GameEvents;

type Listener<E extends EventKey> = GameEvents[E] extends void ? () => void : (payload: GameEvents[E]) => void;

export class EventBus {
	private listeners = new Map<EventKey, Set<Listener<any>>>();

	public on<E extends EventKey>(event: E, fn: Listener<E>) {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		this.listeners.get(event)!.add(fn as Listener<any>);
		return () => this.off(event, fn); // Return an unsubscribe event
	}

	public off<E extends EventKey>(event: E, fn: Listener<E>) {
		this.listeners.get(event)?.delete(fn as Listener<any>);
	}

	emit<E extends EventKey>(event: E): void;
	emit<E extends EventKey>(event: E, payload: GameEvents[E]): void;

	public emit(event: EventKey, payload?: any): void {
		const set = this.listeners.get(event);
		if (!set) return;
		set.forEach((fn) => {
			(fn as any)(payload);
		});
	}
}

export const bus: EventBus = new EventBus();
