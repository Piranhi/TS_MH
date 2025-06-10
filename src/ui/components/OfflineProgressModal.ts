import { GameContext } from "@/core/GameContext";
import { OfflineModalData, OfflineSession } from "@/models/OfflineProgress";
import { formatTime } from "@/shared/utils/stringUtils";

export class OfflineProgressModal {
	constructor(private session: OfflineSession, private data: OfflineModalData) {}

	show() {
		const huntProgress = this.data.hunt; // Fixed: was this.results.hunt

		// Only show modal if there's meaningful hunt progress or player was away for a significant time
		if (!huntProgress || (huntProgress.enemiesKilled === 0 && this.session.duration < 60000)) {
			// Player was away briefly with no meaningful progress - don't show modal
			return;
		}

		const modal = this.createModalElement();
		document.body.appendChild(modal);
		modal.classList.add("show");
	}

	private createModalElement(): HTMLElement {
		const hunt = this.data.hunt!;
		const durationStr = formatTime(this.session.duration);
		const efficiencyStr = `${Math.round(hunt.efficiency * 100)}%`;
		const enemiesStr = hunt.enemiesKilled.toLocaleString();
		const renownStr = hunt.renownGained.toLocaleString();
		const xpStr = hunt.experienceGained.toLocaleString(); // Fixed: was levelsGained

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
		makeItem("Experience Gained", xpStr, "js-experience"); // Fixed: was "Levels Gained"

		card.appendChild(ul);

		// Add treasure section if there are chests
		if (hunt.treasureChests > 0) {
			const treasureSection = this.createTreasureSection(hunt);
			card.appendChild(treasureSection);
		}

		// Add background systems hint
		const backgroundHint = this.createBackgroundProgressHint();
		if (backgroundHint) {
			card.appendChild(backgroundHint);
		}

		// Actions
		const actions = document.createElement("div");
		actions.className = "modal-actions";

		const btnClose = document.createElement("button");
		btnClose.className = "btn primary";
		btnClose.dataset.action = "close";
		btnClose.textContent = "Continue"; // Fixed: rewards are already applied
		actions.appendChild(btnClose);

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

		// Wire up listeners
		this.setupEventListeners(modal);

		return modal;
	}

	private createTreasureSection(hunt: any): HTMLElement {
		const section = document.createElement("div");
		section.className = "treasure-section";

		const title = document.createElement("h3");
		title.textContent = `🎁 Treasure Chests Found: ${hunt.treasureChests}`;
		section.appendChild(title);

		const breakdown = document.createElement("div");
		breakdown.className = "chest-breakdown";

		hunt.treasureBreakdown.forEach((item: any) => {
			const timing = document.createElement("div");
			timing.className = "chest-timing";
			timing.textContent = `📦 ${item.chestsFromInterval} chest(s) after ${item.interval}`;
			breakdown.appendChild(timing);
		});

		section.appendChild(breakdown);

		if (hunt.nextChestIn > 0) {
			const nextChest = document.createElement("p");
			nextChest.className = "next-chest";
			nextChest.textContent = `⏰ Next chest in ${formatTime(hunt.nextChestIn)}`;
			section.appendChild(nextChest);
		}

		return section;
	}

	private createBackgroundProgressHint(): HTMLElement | null {
		// Show a subtle hint about other systems that progressed
		const updatedSystems = this.data.systemsUpdated.filter((name) => name !== "Hunt");

		if (updatedSystems.length === 0) return null;

		const hint = document.createElement("div");
		hint.className = "background-progress-hint";

		const text = document.createElement("p");
		text.className = "hint-text";
		text.innerHTML = `💪 Also updated: ${updatedSystems.join(", ")} <span class="small">(progress applied automatically)</span>`;

		hint.appendChild(text);
		return hint;
	}

	private setupEventListeners(modal: HTMLElement) {
		// Close button
		const closeBtn = modal.querySelector('.btn[data-action="close"]');
		closeBtn?.addEventListener("click", () => this.close());

		// Open chests button
		const openChestsBtn = modal.querySelector('[data-action="open-chests"]');
		openChestsBtn?.addEventListener("click", () => this.openChestsAnimation());

		// Close on backdrop click
		const backdrop = modal.querySelector('.offline-modal__backdrop[data-action="close"]');
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

	private async openChestsAnimation() {
		const huntProgress = this.data.hunt!;
		const context = GameContext.getInstance();
		const currentArea = context.currentRun?.huntManager.getActiveArea() ?? null;

		if (!currentArea) return;

		// Fun chest opening animation
		for (let i = 0; i < huntProgress.treasureChests; i++) {
			// Roll loot for each chest (note: chests were already added to inventory)
			// This is just for visual feedback
			const loot = currentArea.rollOfflineLoot ? currentArea.rollOfflineLoot() : ["basic_item"];

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
                <p>Items were already added to your inventory</p>
                <button onclick="this.parentElement.parentElement.remove()">Awesome!</button>
            </div>
        `;

		document.body.appendChild(summaryElement);

		// Auto-remove after a few seconds
		setTimeout(() => summaryElement.remove(), 3000);
	}
}
