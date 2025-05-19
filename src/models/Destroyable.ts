import { GameEvents } from "@/core/EventBus";
import { unbindAll } from "@/shared/utils/busUtils";

interface DestroyableInterface {
	destroy(): void;
}

export abstract class Destroyable implements DestroyableInterface {
	protected destroyed = false;
	protected eventBindings: [keyof GameEvents, Function][] = [];

	destroy() {
		if (this.destroyed) return;
		this.destroyed = true;
		unbindAll(this.eventBindings);
	}

	protected getById(id: string): HTMLElement {
		const el = document.getElementById(id);
		if (!el) throw new Error(`Element with id "${id}" not found`);
		return el;
	}
}
