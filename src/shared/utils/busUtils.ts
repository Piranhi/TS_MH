import { bus, GameEvents } from "@/core/EventBus";

export function bindEvent<K extends keyof GameEvents>(bindings: [keyof GameEvents, Function][], event: K, handler: (payload: GameEvents[K]) => void) {
	bus.on(event, handler);
	bindings.push([event, handler]);
}

export function unbindAll(bindings: [keyof GameEvents, Function][]) {
	for (const [event, handler] of bindings) {
		bus.off(event as keyof GameEvents, handler as any);
	}
	bindings.length = 0;
}
