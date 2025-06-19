import { ProgressBar } from "../components/ProgressBar";
import { Resource } from "@/features/inventory/Resource";
import { CraftSlot } from "@/features/settlement/BlacksmithManager";
import { UIBase } from "./UIBase";
import { ResourceSpec } from "@/shared/types";

/**
 * Component representing a single blacksmith crafting slot.
 * Manages its own DOM structure and updates efficiently without rebuilding.
 */
export class BlacksmithSlot extends UIBase {
	private slotIndex: number;

	// Cached DOM elements - created once, updated many times
	private selectBtn!: HTMLButtonElement;
	private optionRow!: HTMLElement;
	private icon!: HTMLImageElement;
	private levelEl!: HTMLElement;
	private xpBar!: ProgressBar;
	private xpText!: HTMLElement;
	private costEl!: HTMLElement;
	private progressBar!: ProgressBar;
	private progressText!: HTMLElement;
	private contentEl!: HTMLElement;

	// Cached state to avoid unnecessary updates
	private currentResourceId: string | null = null;
	private lastLevel: number = -1;
	private lastXp: number = -1;
	private lastProgress: number = -1;

	// Track recipe cards and their cost displays
	private recipeCards: Map<
		string,
		{
			card: HTMLElement;
			costsEl: HTMLElement;
			isHovered: boolean;
		}
	> = new Map();

	constructor(container: HTMLElement, slotIndex: number) {
		super();
		this.element = container;
		this.slotIndex = slotIndex;
		this.build();
	}

	/**
	 * Builds the initial DOM structure once.
	 * All future updates will modify these elements rather than recreating them.
	 */
	protected build(): void {
		this.element.className = "blacksmith-slot-wrapper";

		const slotEl = document.createElement("div");
		slotEl.className = "blacksmith-slot";
		this.element.appendChild(slotEl);

		// Create select button
		this.selectBtn = document.createElement("button");
		this.selectBtn.className = "bs-select-btn";
		this.selectBtn.textContent = "Choose";
		this.bindDomEvent(this.selectBtn, "click", () => this.toggleOptions());
		this.element.appendChild(this.selectBtn);

		// Create content area
		this.contentEl = document.createElement("div");
		this.contentEl.className = "bs-slot-content";
		slotEl.appendChild(this.contentEl);

		// Create options row (hidden by default)
		this.optionRow = document.createElement("div");
		this.optionRow.className = "bs-option-row";
		slotEl.appendChild(this.optionRow);

		// Build the resource selection cards once
		this.buildResourceOptions();

		// Create selected resource info area
		const info = document.createElement("div");
		info.className = "bs-selected-info";

		// Icon and XP bar
		const iconWrap = document.createElement("div");
		iconWrap.className = "bs-icon-wrapper";
		this.icon = document.createElement("img");
		this.icon.className = "bs-resource-icon";
		iconWrap.appendChild(this.icon);

		const xpContainer = document.createElement("div");
		xpContainer.className = "bs-xp-bar-container";
		iconWrap.appendChild(xpContainer);

		this.xpText = document.createElement("div");
		this.xpText.className = "bs-xp-text";
		xpContainer.appendChild(this.xpText);

		this.xpBar = new ProgressBar({
			container: xpContainer,
			maxValue: 1,
			initialValue: 0,
			smooth: true,
		});

		info.appendChild(iconWrap);

		// Level display
		this.levelEl = document.createElement("div");
		this.levelEl.className = "bs-level";
		info.appendChild(this.levelEl);

		this.contentEl.appendChild(info);

		// Cost icons
		this.costEl = document.createElement("div");
		this.costEl.className = "bs-cost-icons";
		info.appendChild(this.costEl);

		// Progress bar
		const barContainer = document.createElement("div");
		this.contentEl.appendChild(barContainer);

		this.progressText = document.createElement("div");
		this.progressText.className = "progress-text";
		barContainer.appendChild(this.progressText);

		this.progressBar = new ProgressBar({
			container: barContainer,
			maxValue: 1,
			initialValue: 0,
		});
	}

	/**
	 * Builds the resource selection options.
	 * Only called when available resources change (rare).
	 */
	private buildResourceOptions(): void {
		this.optionRow.innerHTML = "";
		this.recipeCards.clear();

		const resources = this.context.resources.getAllResources();
		const available = Array.from(resources.entries())
			.filter(([id, d]) => id !== "raw_ore" && d.isUnlocked && !d.infinite)
			.map(([id]) => id);

		available.forEach((resourceId) => {
			const spec = Resource.getSpec(resourceId);
			if (!spec) return;

			const { card, costsEl } = this.createResourceCard(resourceId, spec);
			this.optionRow.appendChild(card);

			// Store card reference for updates
			this.recipeCards.set(resourceId, {
				card,
				costsEl,
				isHovered: false,
			});
		});
	}

	/**
	 * Creates a single resource selection card.
	 * @param resourceId - The resource identifier
	 * @param spec - The resource specification
	 */
	private createResourceCard(resourceId: string, spec: ResourceSpec): { card: HTMLElement; costsEl: HTMLElement } {
		const card = document.createElement("div");
		card.className = "bs-recipe-card";

		// Icon
		const img = document.createElement("img");
		img.src = spec.iconUrl;
		card.appendChild(img);

		// Costs - always visible, updated on hover and resource changes
		const costsEl = document.createElement("div");
		costsEl.className = "bs-recipe-costs";
		card.appendChild(costsEl);

		// Populate initial costs
		this.updateCardCosts(costsEl, spec);

		// Time
		const timeEl = document.createElement("div");
		timeEl.className = "bs-recipe-time";
		timeEl.textContent = `${spec.craftTime}s`;
		card.appendChild(timeEl);

		// Track hover state
		this.bindDomEvent(card, "mouseenter", () => {
			const cardData = this.recipeCards.get(resourceId);
			if (cardData) {
				cardData.isHovered = true;
				this.updateCardCosts(costsEl, spec);
			}
		});

		this.bindDomEvent(card, "mouseleave", () => {
			const cardData = this.recipeCards.get(resourceId);
			if (cardData) {
				cardData.isHovered = false;
			}
		});

		// Handle selection
		this.bindDomEvent(card, "click", () => {
			this.context.blacksmith.setSlotResource(this.slotIndex, resourceId);
			this.$(".blacksmith-slot").classList.remove("choosing");
			this.update(); // Immediate update after selection
		});

		return { card, costsEl };
	}

	/**
	 * Updates the cost display for a resource card.
	 * Called on hover to ensure costs are always current.
	 */
	private updateCardCosts(costsEl: HTMLElement, spec: ResourceSpec): void {
		costsEl.innerHTML = "";

		spec.requires.forEach((req) => {
			if (!req.resource) return;

			const have = this.context.resources.getResourceQuantity(req.resource);
			const reqSpec = Resource.getSpec(req.resource);

			const item = document.createElement("div");
			item.className = "bs-cost-item";

			const icon = document.createElement("img");
			icon.src = reqSpec?.iconUrl ?? "";
			item.appendChild(icon);

			const text = document.createElement("span");
			text.textContent = `${have}/${req.quantity}`;
			if (have < req.quantity) text.classList.add("insufficient");
			item.appendChild(text);

			costsEl.appendChild(item);
		});
	}

	/**
	 * Toggles the resource selection options visibility.
	 */
	private toggleOptions(): void {
		this.$(".blacksmith-slot").classList.toggle("choosing");
	}

	/**
	 * Updates only the parts of the UI that have changed.
	 * Called frequently (every tick) so must be efficient.
	 */
	public update(): void {
		const slot = this.context.blacksmith.getSlots()[this.slotIndex];
		if (!slot) return;

		// Check if resource changed
		if (slot.resourceId !== this.currentResourceId) {
			this.currentResourceId = slot.resourceId;
			this.onResourceChanged(slot);
		}

		// Update progress if crafting
		if (slot.resourceId && slot.progress !== this.lastProgress) {
			this.updateProgress(slot);
		}

		// Update resource data if changed
		if (slot.resourceId) {
			this.updateResourceData(slot.resourceId);
		}
	}

	/**
	 * Called when the selected resource changes.
	 * Updates all resource-specific UI elements.
	 */
	private onResourceChanged(slot: CraftSlot): void {
		if (slot.resourceId) {
			const spec = Resource.getSpec(slot.resourceId);
			if (spec) {
				// Update button text and icon
				this.selectBtn.textContent = spec.name;
				this.icon.src = spec.iconUrl;

				// Update progress bar max value
				this.progressBar.setMax(spec.craftTime);

				// Update costs
				this.updateCosts(spec);

				// Show content, hide if empty
				this.contentEl.style.display = "block";
			}
		} else {
			// Clear everything
			this.selectBtn.textContent = "Choose";
			this.icon.src = "";
			this.levelEl.textContent = "";
			this.xpText.textContent = "";
			this.costEl.innerHTML = "";
			this.progressText.textContent = "";
			this.progressBar.setValue(0);
			this.contentEl.style.display = "none";
		}
		// Reset the progress bar.
		this.lastProgress = 0;
		this.progressBar.setValue(0);
	}

	/**
	 * Updates the crafting progress display.
	 */
	private updateProgress(slot: CraftSlot): void {
		this.lastProgress = slot.progress;
		const spec = Resource.getSpec(slot.resourceId!);
		if (spec) {
			this.progressBar.setValue(spec.craftTime - slot.progress);
			this.progressText.textContent = `${Math.ceil(slot.progress)}s`;
		}
	}

	/**
	 * Updates resource level and XP only if changed.
	 */
	private updateResourceData(resourceId: string): void {
		const data = this.context.resources.getResourceData(resourceId);
		if (!data) return;

		// Update level if changed
		if (data.level !== this.lastLevel) {
			this.lastLevel = data.level;
			this.levelEl.textContent = `Lv ${data.level}`;

			// Update XP bar max value
			const xpNeeded = data.level * 10;
			this.xpBar.setMax(xpNeeded);
		}

		// Update XP if changed
		if (data.xp !== this.lastXp) {
			this.lastXp = data.xp;
			const xpNeeded = data.level * 10;
			this.xpBar.setValue(data.xp);
			this.xpText.textContent = `XP ${data.xp}/${xpNeeded}`;
		}
	}

	/**
	 * Updates the cost display for the selected resource.
	 * Shows current vs required resources.
	 */
	private updateCosts(spec: ResourceSpec): void {
		this.costEl.innerHTML = "";

		spec.requires.forEach((req) => {
			if (!req.resource) return;

			const have = this.context.resources.getResourceQuantity(req.resource);
			const reqSpec = Resource.getSpec(req.resource);

			const item = document.createElement("div");
			item.className = "bs-cost-item";

			const icon = document.createElement("img");
			icon.src = reqSpec?.iconUrl ?? "";
			item.appendChild(icon);

			const text = document.createElement("span");
			text.textContent = `${have}/${req.quantity}`;
			if (have < req.quantity) text.classList.add("insufficient");
			item.appendChild(text);

			this.costEl.appendChild(item);
		});
	}

	/**
	 * Called when available resources change.
	 * Updates costs on existing cards or rebuilds if resources added/removed.
	 */
	public onResourcesChanged(): void {
		// Check if we need to rebuild (new resources unlocked)
		const resources = this.context.resources.getAllResources();
		const available = Array.from(resources.entries())
			.filter(([id, d]) => id !== "raw_ore" && d.isUnlocked && !d.infinite)
			.map(([id]) => id);

		// If the available resource list changed, rebuild
		if (available.length !== this.recipeCards.size) {
			this.buildResourceOptions();
		} else {
			// Just update the costs on existing cards
			this.recipeCards.forEach((cardData, resourceId) => {
				const spec = Resource.getSpec(resourceId);
				if (spec) {
					this.updateCardCosts(cardData.costsEl, spec);
				}
			});
		}

		// Also update current costs if we have a selected resource
		if (this.currentResourceId) {
			const spec = Resource.getSpec(this.currentResourceId);
			if (spec) {
				this.updateCosts(spec);
			}
		}
	}

	/**
	 * Custom cleanup called by UIBase destroy method.
	 */
	protected cleanUp(): void {
		// Clean up progress bars
		if (this.progressBar) {
			this.progressBar.destroy();
		}
		if (this.xpBar) {
			this.xpBar.destroy();
		}

		// Clear cached recipe cards
		this.recipeCards.clear();
	}
}
