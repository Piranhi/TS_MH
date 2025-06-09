import { GameContext } from "@/core/GameContext";
import { OfflineProgressManager, OfflineProgressResult, OfflineSession } from "@/models/OfflineProgress";
import { formatTime } from "@/shared/utils/stringUtils";

export class OfflineProgressModal {
	private session: OfflineSession;
	private results: Partial<OfflineProgressResult>;

	constructor(session: OfflineSession, results: Partial<OfflineProgressResult>) {
		this.session = session;
		this.results = results;
	}

	show() {
		const huntProgress = this.results.hunt;
		this.applyBackgroundProgress();
		// Only show modal if there's meaningful hunt progress
		/* 		if (!huntProgress || huntProgress.enemiesKilled === 0) {
			// Still apply background progress (like training) without showing modal
			this.applyBackgroundProgress();
			return;
		} */

		const modal = this.createModalElement();
		document.body.appendChild(modal);
		modal.classList.add("show");
	}

	private createModalElement(): HTMLElement {
		const hunt = this.results.hunt!;
		const durationStr = formatTime(this.session.duration);
		const efficiencyStr = `${Math.round(hunt.efficiency * 100)}%`;
		const enemiesStr = hunt.enemiesKilled.toLocaleString();
		const renownStr = hunt.renownGained.toLocaleString();
		const levelsStr = (hunt.levelsGained ?? 0).toString(); // or experience if you prefer

		// Root
		const modal = document.createElement("div");
		modal.id = "offlineModal";
		modal.className = "offline-modal";

		// Backdrop
		const backdrop = document.createElement("div");
		backdrop.className = "offline-modal__backdrop";
		backdrop.dataset.action = "close";
		modal.appendChild(backdrop);

		// Card
		const card = document.createElement("div");
		card.className = "offline-modal__card";
		card.setAttribute("role", "dialog");
		card.setAttribute("aria-modal", "true");

		// Title
		const title = document.createElement("h2");
		title.className = "modal-title";
		title.textContent = "Welcome Back!";
		card.appendChild(title);

		// Subtext: away time
		const sub = document.createElement("p");
		sub.className = "modal-sub";
		sub.innerHTML = `You were away for <span class="js-away-time">${durationStr}</span>`;
		card.appendChild(sub);

		// Meta lines: Area + Efficiency
		const addMeta = (label: string, value: string, spanClass: string) => {
			const p = document.createElement("p");
			p.className = "modal-meta";
			p.innerHTML = `<strong>${label}</strong> <span class="${spanClass}">${value}</span>`;
			card.appendChild(p);
		};
		addMeta("Area:", hunt.areaName, "js-area");
		addMeta("Offline efficiency:", efficiencyStr, "js-efficiency");

		// Section title
		const sectionTitle = document.createElement("h3");
		sectionTitle.className = "section-title";
		sectionTitle.textContent = "Combat Progress";
		card.appendChild(sectionTitle);

		// Progress list
		const ul = document.createElement("ul");
		ul.className = "progress-list";

		const makeItem = (label: string, value: string, spanClass: string) => {
			const li = document.createElement("li");

			const spanLabel = document.createElement("span");
			spanLabel.className = "label";
			spanLabel.textContent = label;

			const spanValue = document.createElement("span");
			spanValue.className = `value ${spanClass}`;
			spanValue.textContent = value;

			li.appendChild(spanLabel);
			li.appendChild(spanValue);
			ul.appendChild(li);
		};

		makeItem("Enemies Defeated", enemiesStr, "js-enemies");
		makeItem("Renown Gained", renownStr, "js-renown");
		makeItem("Levels Gained", levelsStr, "js-levels");

		card.appendChild(ul);

		// Actions
		const actions = document.createElement("div");
		actions.className = "modal-actions";

		const btnClaim = document.createElement("button");
		btnClaim.className = "btn primary";
		btnClaim.dataset.action = "claim";
		btnClaim.textContent = "Claim all rewards";
		actions.appendChild(btnClaim);

		// Only show "Open chests" if you actually have chests
		if (hunt.treasureChests > 0) {
			const btnOpen = document.createElement("button");
			btnOpen.className = "btn secondary";
			btnOpen.dataset.action = "open-chests";
			btnOpen.textContent = "Open chests";
			actions.appendChild(btnOpen);
		}

		card.appendChild(actions);

		modal.appendChild(card);

		// Wire up listeners just like before
		this.setupEventListeners(modal);

		return modal;
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
            📦 Next treasure chest in ${formatTime(huntProgress.nextChestIn)}
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
            ⏰ Next chest in ${formatTime(huntProgress.nextChestIn)}
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
		const context = GameContext.getInstance();
		const offlineManager = context.services.offlineManager;

		const backgroundResults = { ...this.results };
		delete backgroundResults.hunt; // Don't re-apply hunt progress

		offlineManager.applyOfflineRewards(backgroundResults);
	}

	private claimAllRewards() {
		try {
			const context = GameContext.getInstance();
			const offlineManager = context.services.offlineManager;
			offlineManager.applyOfflineRewards(this.results);
		} catch (err) {
			console.error("Failed to apply offline rewards", err);
		} finally {
			this.close();
		}
	}

	private async openChestsAnimation() {
		const huntProgress = this.results.hunt!;
		const context = GameContext.getInstance();
		const currentArea = context.currentRun?.huntManager.getActiveArea() ?? null;

		if (!currentArea) return;

		// Fun chest opening animation
		for (let i = 0; i < huntProgress.treasureChests; i++) {
			// Roll loot for each chest
			const loot = currentArea.rollOfflineLoot();

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

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private close() {
		const modal = document.querySelector(".offline-modal");
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
