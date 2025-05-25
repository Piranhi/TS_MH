import { GameContext } from "@/core/GameContext";
import { OfflineProgressManager, OfflineProgressResult, OfflineSession } from "@/models/OfflineProgress";

export class OfflineProgressModal {
	private session: OfflineSession;
	private results: Partial<OfflineProgressResult>;

	constructor(session: OfflineSession, results: Partial<OfflineProgressResult>) {
		this.session = session;
		this.results = results;
	}

	show() {
		const huntProgress = this.results.hunt;

		// Only show modal if there's meaningful hunt progress
		if (!huntProgress || huntProgress.enemiesKilled === 0) {
			// Still apply background progress (like training) without showing modal
			this.applyBackgroundProgress();
			return;
		}

		const modal = this.createModalElement();
		document.body.appendChild(modal);
		modal.classList.add("show");
	}

	private createModalElement(): HTMLElement {
		const huntProgress = this.results.hunt!;

		const modalHtml = `
    <div class="offline-progress-modal">
      <div class="modal-content">
        <h2>Welcome Back!</h2>
        <p class="offline-duration">
          You were away for ${this.formatTime(this.session.duration)}
        </p>
        
        <div class="hunt-area-info">
          <h3>📍 ${huntProgress.areaName}</h3>
          <p class="efficiency">Offline efficiency: ${Math.round(huntProgress.efficiency * 100)}%</p>
        </div>

        <div class="combat-rewards">
          <h3>⚔️ Combat Progress</h3>
          <div class="reward-list">
            <div class="reward-item">
              <span class="icon">🗡️</span>
              <span class="label">Enemies Defeated:</span>
              <span class="value">${huntProgress.enemiesKilled.toLocaleString()}</span>
            </div>
            <div class="reward-item">
              <span class="icon">⭐</span>
              <span class="label">Renown Gained:</span>
              <span class="value">${huntProgress.renownGained.toString()}</span>
            </div>
            <div class="reward-item">
              <span class="icon">📈</span>
              <span class="label">Experience:</span>
              <span class="value">${huntProgress.experienceGained.toLocaleString()}</span>
            </div>
          </div>
        </div>

        ${this.renderTreasureSection()}
        ${this.renderBackgroundProgressHint()}
        
        <div class="modal-actions">
          <button class="claim-btn primary" data-action="claim">
            Claim All Rewards
          </button>
          ${
			huntProgress.treasureChests > 0
				? `
            <button class="open-chests-btn highlight" data-action="open-chests">
              🎁 Open ${huntProgress.treasureChests} Chest${huntProgress.treasureChests > 1 ? "s" : ""}!
            </button>
          `
				: ""
		}
        </div>
      </div>
      <div class="modal-backdrop" data-action="close"></div>
    </div>
  `;

		const modal = document.createElement("div");
		modal.innerHTML = modalHtml;
		const modalElement = modal.firstElementChild as HTMLElement;

		// Add event listeners with proper 'this' context
		this.setupEventListeners(modalElement);

		return modalElement;
	}

	private setupEventListeners(modal: HTMLElement) {
		// Claim button
		const claimBtn = modal.querySelector('[data-action="claim"]');
		claimBtn?.addEventListener("click", () => this.claimAllRewards());

		// Open chests button
		const openChestsBtn = modal.querySelector('[data-action="open-chests"]');
		openChestsBtn?.addEventListener("click", () => this.openChestsAnimation());

		// Close on backdrop
		const backdrop = modal.querySelector('[data-action="close"]');
		backdrop?.addEventListener("click", () => this.close());

		// Escape key to close
		const handleKeydown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				this.close();
				document.removeEventListener("keydown", handleKeydown);
			}
		};
		document.addEventListener("keydown", handleKeydown);
	}

	private renderTreasureSection(): string {
		const huntProgress = this.results.hunt!;

		if (huntProgress.treasureChests === 0) {
			return `
        <div class="treasure-section no-treasure">
          <p class="next-chest">
            📦 Next treasure chest in ${this.formatTime(huntProgress.nextChestIn)}
          </p>
        </div>
      `;
		}

		return `
      <div class="treasure-section">
        <h3>🎁 Treasure Chests Found: ${huntProgress.treasureChests}</h3>
        <div class="chest-breakdown">
          ${huntProgress.treasureBreakdown
			.map(
				(breakdown) => `
            <div class="chest-timing">
              📦 ${breakdown.chestsFromInterval} chest(s) after ${breakdown.interval}
            </div>
          `
			)
			.join("")}
        </div>
        ${
		huntProgress.nextChestIn > 0
			? `
          <p class="next-chest">
            ⏰ Next chest in ${this.formatTime(huntProgress.nextChestIn)}
          </p>
        `
			: ""
	}
      </div>
    `;
	}

	private renderBackgroundProgressHint(): string {
		// Show a subtle hint about other progress happening
		const trainingProgress = this.results.training;
		const hasTrainingProgress = trainingProgress?.hasAnyProgress;

		if (!hasTrainingProgress) return "";

		return `
      <div class="background-progress-hint">
        <p class="hint-text">
          💪 Your training also progressed while away
          <span class="small">(+${trainingProgress.totalLevelsGained} levels)</span>
        </p>
      </div>
    `;
	}

	private applyBackgroundProgress() {
		// Apply non-hunt progress silently (training, settlement, etc.)
		const offlineManager = OfflineProgressManager.getInstance();

		const backgroundResults = { ...this.results };
		delete backgroundResults.hunt; // Don't re-apply hunt progress

		offlineManager.applyOfflineRewards(backgroundResults);
	}

	private claimAllRewards() {
		const offlineManager = OfflineProgressManager.getInstance();
		offlineManager.applyOfflineRewards(this.results);
		this.close();
	}

	private async openChestsAnimation() {
		const huntProgress = this.results.hunt!;
		const context = GameContext.getInstance();
		const currentArea = context.currentRun?.huntManager.getActiveArea();

		if (!currentArea) return;

		// Fun chest opening animation
		for (let i = 0; i < huntProgress.treasureChests; i++) {
			// Roll loot for each chest
			const loot = currentArea.rollLoot();

			// Add to inventory
			loot.forEach((itemId) => {
				context.inventory.addLootById(itemId);
			});

			// Visual feedback
			this.showChestOpenAnimation(i + 1, huntProgress.treasureChests, loot);

			// Small delay for satisfaction
			await this.sleep(400);
		}

		// Show summary of all loot
		this.showLootSummary();
	}

	private showChestOpenAnimation(current: number, total: number, loot: string[]) {
		// Create floating chest animation
		const chestElement = document.createElement("div");
		chestElement.className = "chest-opening";
		chestElement.innerHTML = `
      <div class="chest-icon">📦</div>
      <div class="chest-number">${current}/${total}</div>
      <div class="loot-preview">${loot.length} items</div>
    `;

		document.body.appendChild(chestElement);

		// Remove after animation
		setTimeout(() => chestElement.remove(), 2000);
	}

	private formatTime(ms: number): string {
		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days}d ${hours % 24}h`;
		if (hours > 0) return `${hours}h ${minutes % 60}m`;
		if (minutes > 0) return `${minutes}m`;
		return `${seconds}s`;
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private close() {
		const modal = document.querySelector(".offline-progress-modal");
		modal?.remove();
	}

	private showLootSummary() {
		// Simple implementation - you can enhance this
		const summaryElement = document.createElement("div");
		summaryElement.className = "loot-summary";
		summaryElement.innerHTML = `
    <div class="summary-content">
      <h3>🎁 All Chests Opened!</h3>
      <p>Items have been added to your inventory</p>
      <button onclick="this.remove()">Awesome!</button>
    </div>
  `;

		document.body.appendChild(summaryElement);

		// Auto-remove after a few seconds
		setTimeout(() => summaryElement.remove(), 3000);
	}
}
