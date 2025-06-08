import { GameEvents } from "@/core/EventBus";
import { unbindAll } from "@/shared/utils/busUtils";

export abstract class GameBase {
    protected eventBindings: [keyof GameEvents, Function][] = [];

    protected cleanUp() {
        unbindAll(this.eventBindings);
    }

    protected getById(id: string): HTMLElement {
        const el = document.getElementById(id);
        if (!el) throw new Error(`Element with id "${id}" not found`);
        return el;
    }
}
