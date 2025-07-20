// src/core/FeatureBase.ts
import { GameBase } from "./GameBase";
import { bus } from "./EventBus";
import { MilestoneManager } from "@/models/MilestoneManager";

export abstract class FeatureBase extends GameBase {
	protected featureActive = false;
	private unsubscribeUnlock?: () => void;

	constructor(private readonly requiredMilestone: string) {
		super();
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
				this.unsubscribeUnlock?.(); // Clean up the listener
				this.unsubscribeUnlock = undefined;
			}
		});
	}

	private activateFeature() {
		this.featureActive = true;
		this.onFeatureActivated();
	}

	/**
	 * Override this method to define what happens when your feature unlocks
	 * This is where you'd subscribe to GameTick or set up other systems
	 */
	protected abstract onFeatureActivated(): void;

	protected cleanUp() {
		super.cleanUp();
		this.unsubscribeUnlock?.();
	}

	public isActive(): boolean {
		return this.featureActive;
	}
}
