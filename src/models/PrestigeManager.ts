import { bus } from "@/core/EventBus";
import { Player } from "../core/Player";
import { GameContext } from "@/core/GameContext";

export class PrestigeManager {
	private onCloseClick: ((e: Event) => void) | null = null;
	private prestigeBtn: HTMLButtonElement;
	private context = GameContext.getInstance();

	constructor() {
		this.onCloseClick = (e) => this.closePrestigeModal();
		this.prestigeBtn = document.getElementById("prestige-ok-btn")! as HTMLButtonElement;
		this.prestigeBtn.addEventListener("click", this.onCloseClick);
	}
	prestige() {
		if (this.checkCanPrestige()) {
			this.handlePrestigeRewards();
			bus.emit("game:prestigePrep");
			bus.emit("game:prestige");
			this.showPrestigeModal(["test", "test2"]);
		}
	}

	checkCanPrestige(): boolean {
		return true;
	}

	private handlePrestigeRewards() {
		const player = Player.getInstance();

		const settlementBuildPoints = this.context.settlement.getBuildPointsFromPrestige();
		this.context.settlement.modifyBuildPoints(settlementBuildPoints);
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
