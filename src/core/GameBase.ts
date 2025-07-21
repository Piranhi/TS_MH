import { GameEvents } from "@/core/EventBus";
import { bindEvent, unbindAll } from "@/shared/utils/busUtils";
import { FeatureUnlockManager } from "./FeatureUnlockManager";

export abstract class GameBase {
	protected eventBindings: [keyof GameEvents, Function][] = [];
	protected featureUnlock?: FeatureUnlockManager;

	// Feature Unlock System
	protected setupFeatureUnlock(milestone: string, onActivated: () => void) {
		this.featureUnlock = new FeatureUnlockManager(milestone, onActivated);
	}

	protected isFeatureActive(): boolean {
		return this.featureUnlock?.isActive() ?? true; // Default to true if no unlock system
	}

	protected setupTickingFeature(milestone: string, additionalSetup?: () => void) {
		this.setupFeatureUnlock(milestone, () => {
			bindEvent(this.eventBindings, "Game:GameTick", (dt) => {
				if (this.handleTick) {
					this.handleTick(dt);
				}
			});
			additionalSetup?.();
		});
	}

	protected handleTick?(dt: number): void;

	protected cleanUp() {
		unbindAll(this.eventBindings);
		this.featureUnlock?.cleanup(); // Always clean up if it exists
	}

	// UI Helpers

	protected getById(id: string): HTMLElement {
		const el = document.getElementById(id);
		if (!el) throw new Error(`Element with id "${id}" not found`);
		return el;
	}
}
