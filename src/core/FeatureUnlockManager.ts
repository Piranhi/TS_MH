// src/core/FeatureUnlockManager.ts
import { bus } from "./EventBus";
import { MilestoneManager } from "@/models/MilestoneManager";

export class FeatureUnlockManager {
	private featureActive = false;
	private unsubscribeUnlock?: () => void;
	private onActivatedCallback?: () => void;

	constructor(private readonly requiredMilestone: string, onActivated?: () => void) {
		if (!requiredMilestone) return;
		this.onActivatedCallback = onActivated;
		this.checkAndSetupFeature();
	}

	private checkAndSetupFeature() {
		const milestones = MilestoneManager.instance;

		if (milestones.has(this.requiredMilestone)) {
			this.activateFeature();
		} else {
			this.listenForUnlock();
		}
	}

	private listenForUnlock() {
		this.unsubscribeUnlock = bus.on("milestone:achieved", (payload) => {
			if (payload.tag === this.requiredMilestone) {
				this.activateFeature();
				this.cleanupListener(); // Auto-cleanup after activation
			}
		});
	}

	private activateFeature() {
		this.featureActive = true;
		this.onActivatedCallback?.();
	}

	public isActive(): boolean {
		return this.featureActive;
	}

	private cleanupListener() {
		this.unsubscribeUnlock?.();
		this.unsubscribeUnlock = undefined;
	}

	public cleanup() {
		this.cleanupListener();
	}
}
