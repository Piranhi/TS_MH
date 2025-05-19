import { bus } from "@/core/EventBus";

export class PrestigeManager {
	prestige() {
		if (this.checkCanPrestige()) {
			//const
			bus.emit("game:prestigePrep");
			bus.emit("game:prestige");
		}
	}

	checkCanPrestige(): boolean {
		return true;
	}
}
