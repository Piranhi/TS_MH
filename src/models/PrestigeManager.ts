import { bus } from "@/core/EventBus";
import { GameContext } from "@/core/GameContext";

export class PrestigeManager {
	private onCloseClick: ((e: Event) => void) | null = null;
	private prestigeBtn: HTMLButtonElement;

	constructor() {
		this.onCloseClick = (e) => this.closePrestigeModal();
		this.prestigeBtn = document.getElementById("prestige-ok-btn")! as HTMLButtonElement;
		this.prestigeBtn.addEventListener("click", this.onCloseClick);
	}
	prestige() {
		if (this.checkCanPrestige()) {
			const context = GameContext.getInstance();
			// 1. Calculate rewards from current run

			const runPoints = context.currentRun?.getRunStats();
			const buildPoints = context.settlement.getBuildPointsFromPrestige();

			// 2. Apply persistent rewards
			context.settlement.modifyBuildPoints(buildPoints);
			//context.player.updatePrestigeStats();

			// 3. Trigger prestige events
			bus.emit("game:prestigePrep"); // Ends current run
			bus.emit("game:prestige"); // Starts New Run

			// 4. Show Modal
			this.showPrestigeModal(["test", "test2"]);
		}
	}

	checkCanPrestige(): boolean {
		return true;
	}

	showPrestigeModal(rewards: string[]) {
		const modal = document.getElementById("prestige-modal")!;
		const rewardList = modal.querySelector(".reward-list")! as HTMLUListElement;
		//rewardList.innerHTML = rewards.map((r) => `<li>${r}</li>`).join("");
		modal.classList.remove("hidden");
	}

	closePrestigeModal() {
		document.getElementById("prestige-modal")!.classList.add("hidden");
		this.destroy();
	}

	destroy() {
		if (this.onCloseClick) {
			this.prestigeBtn?.removeEventListener("click", this.onCloseClick);
			this.onCloseClick = null;
		}
	}
}
