import { ProgressBar } from "../components/ProgressBar";
import { Resource } from "@/features/inventory/Resource";
import { CraftSlot } from "@/features/settlement/BlacksmithManager";
import { UIBase } from "./UIBase";
import { ResourceSpec } from "@/shared/types";
import { Tooltip, TooltipListItem } from "./Tooltip";
import { BalanceCalculators, GAME_BALANCE } from "@/balance/GameBalance";
import { formatNumberShort } from "@/shared/utils/stringUtils";

/**
 * Component representing a single blacksmith crafting slot.
 * Manages its own DOM structure and updates efficiently without rebuilding.
 */
export class BlacksmithSlot extends UIBase {
	private slotIndex: number;

	// Cached DOM elements - created once, updated many times
	private optionRow!: HTMLElement;
	private icon!: HTMLImageElement;
	private levelEl!: HTMLElement;
	private xpBar!: ProgressBar;
	private xpText!: HTMLElement;
	private costEl!: HTMLElement;
	private craftProgressBar!: ProgressBar;
	private levelProgressBar!: ProgressBar;
	private progressText!: HTMLElement;
	private contentEl!: HTMLElement;
	private status: "empty" | "crafting" | "choosing" = "empty";

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
			timeEl: HTMLElement;
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
		this.showCrafting();

		this.bindDomEvent(slotEl, "mouseenter", () => this.createTooltip());
		this.bindDomEvent(slotEl, "mouseleave", () => Tooltip.instance.hide());
		this.bindDomEvent(this.element, "click", () => this.handleClick());

		// Build the resource selection cards once
		//this.buildResourceOptions();
	}

	private handleClick(): void {
		switch (this.status) {
			case "empty":
				this.showOptions();
				break;
			case "crafting":
				this.showCrafting();
		}
	}

	private createTooltip(): void {
		// Only show tooltip if we have a resource selected
		// Create Upgrade list
		if (!this.currentResourceId) return;

		const resourceData = this.context.resources.getResourceData(this.currentResourceId);
		const currentLevel = resourceData?.level || 1;

		// Combine standard upgrades with level based unlocks from the resource spec
		const upgrades: Array<{ level: number; text: string; unlocked: boolean }> = [];

		const upgradeArray = this.context.resources.getAllUpgrades(this.currentResourceId);
		upgradeArray.forEach((upgrade) => {
			upgrades.push({
				level: upgrade.level,
				text: upgrade.displayText,
				unlocked: currentLevel >= upgrade.level,
			});
		});

		const resourceSpec = Resource.getSpec(this.currentResourceId);
		if (resourceSpec && resourceSpec.unlocks) {
			resourceSpec.unlocks.forEach((unlock) => {
				const unlockedResourceSpec = Resource.getSpec(unlock.id);
				const unlockName = unlockedResourceSpec?.name || unlock.id;
				upgrades.push({
					level: unlock.level,
					text: `Unlock ${unlockName}`,
					unlocked: currentLevel >= unlock.level,
				});
			});
		}

		upgrades.sort((a, b) => a.level - b.level);

		const upgradeList: TooltipListItem[] = upgrades.map((u) => ({
			text: `Lvl ${u.level}: ${u.text}`,
			className: u.unlocked ? "upgrade-unlocked" : "upgrade-locked",
		}));

		Tooltip.instance.show(this.element, {
			icon: this.icon.src,
			type: "Resource upgrade",
			name: "todo",
			list: upgradeList,
		});
	}

	private showEmpty(): void {
		this.element.innerHTML = `        <div class="blacksmith-slot empty">
            <div class="empty-text">Click to select item to craft</div>
        </div>`;
	}

	private showCrafting(): void {
		this.element.innerHTML = `        <div class="blacksmith-slot crafting">
            <div class="blacksmith-slot-header">
    <img class="blacksmith-slot-icon" id="blacksmith-slot-icon">
    <div class="blacksmith-slot-info">
        <div class="blacksmith-slot-details">
            <div class="blacksmith-slot-name" id="blacksmith-slot-name">Iron Sword</div>
            <div class="slot-type">Weapon • Tier 1</div>
        </div>
        <div class="blacksmith-slot-level-info">
            <div class="blacksmith-slot-level" id="blacksmith-slot-level">Lv. 3</div>
            <div class="blacksmith-slot-xp" id="blacksmith-slot-xp">450 / 1000 XP</div>
            <div class="blacksmith-slot-xp-bar" id="blacksmith-slot-xp-bar">
            </div>
        </div>
    </div>

            </div>
            
            <div class="blacksmith-slot-progress">
                <div class="blacksmith-slot-progress-info">
                    <span>Crafting Progress</span>
                    <span>2:34 remaining</span>
                </div>
                <div class="progress-bar" id="blacksmith-slot-progress-bar">
                </div>
            </div>
            
            <div class="slot-resources" id="blacksmith-slot-resources">
            </div>
        </div>`;

		const icon = this.$("#blacksmith-slot-icon") as HTMLImageElement;
		icon.src = "/images/resources/resource_iron_ingot.png";

		const name = this.$("#blacksmith-slot-name");
		name.textContent = "Iron Sword";

		this.craftProgressBar = new ProgressBar({
			container: this.$("#blacksmith-slot-progress-bar"),
			maxValue: 1,
			initialValue: 0.5,
			smooth: true,
			showLabel: true,
		});

		this.levelProgressBar = new ProgressBar({
			container: this.$("#blacksmith-slot-xp-bar"),
			maxValue: 1,
			initialValue: 0.5,
			smooth: true,
			showLabel: true,
		});
		const resourcesEl = this.$("#blacksmith-slot-resources");
		resourcesEl.innerHTML = "";
		resourcesEl.appendChild(this.createSlotResourceItem("iron_ingot"));
	}

	private createSlotResourceItem(resourceId: string): HTMLElement {
		const spec = Resource.getSpec(resourceId);
		if (!spec) return document.createElement("div");

		const item = document.createElement("div");
		item.className = "resource-item";

		const icon = document.createElement("img");
		icon.className = "resource-icon";
		icon.src = spec.iconUrl ?? "";
		item.appendChild(icon);

		const name = document.createElement("div");
		name.className = "resource-name";
		name.textContent = spec.name;
		item.appendChild(name);

		const count = document.createElement("div");
		count.className = "resource-count";
		count.textContent = "0/0";
		item.appendChild(count);

		return item;
	}

	private getCraftingOptions(): string[] {
		this.recipeCards.clear();

		const resources = this.context.resources.getAllResources();
		const available = Array.from(resources.entries())
			.filter(([id, d]) => id !== "raw_ore" && d.isUnlocked && !d.infinite)
			.map(([id]) => id);

		return available;

		available.forEach((resourceId) => {
			const spec = Resource.getSpec(resourceId);
			if (!spec) return;

			const { card, costsEl, timeEl } = this.createResourceCard(resourceId, spec);
			this.optionRow.appendChild(card);

			// Store card reference for updates
			this.recipeCards.set(resourceId, {
				card,
				costsEl,
				timeEl,
				isHovered: false,
			});
		});
	}

	private showOptions(): void {
		this.status = "choosing";
		this.element.innerHTML = `<div class="selection-content">
                <div class="selection-header">
                    <div class="back-button" id="back-button" onclick="toggleSelection('emptySlot')">
                        ←
                    </div>
                    <div class="selection-title">Select Item to Craft</div>
                </div>
                
                <div class="craft-options-list" id="craft-options-list">
                    
        </div>
    </div>`;

		const optionsListEl = this.$("#craft-options-list");
		const options = this.getCraftingOptions();
		options.forEach((resourceId) => {
			const spec = Resource.getSpec(resourceId);
			if (!spec) return;

			const option = this.createCraftOption(resourceId, spec);
			optionsListEl.appendChild(option);
		});

		const backButton = this.$("#back-button");
		backButton.addEventListener("click", () => this.toggleSelection("emptySlot"));
	}

	private toggleSelection(resourceId: string): void {
		if (resourceId === "emptySlot") {
			this.status = "empty";
			this.context.blacksmith.setSlotResource(this.slotIndex, this.currentResourceId);
			this.update();
			return;
		}

		this.status = "choosing";
		this.context.blacksmith.setSlotResource(this.slotIndex, resourceId);
		this.update();
	}

	// Create a single crafting option
	private createCraftOption(resourceId: string, spec: ResourceSpec): HTMLElement {
		const option = document.createElement("div");
		option.className = "craft-option";
		option.addEventListener("click", () => this.toggleSelection(resourceId));

		const header = document.createElement("div");
		header.className = "craft-option-header";

		const icon = document.createElement("img") as HTMLImageElement;
		icon.className = "craft-option-icon";
		icon.src = spec.iconUrl;
		header.appendChild(icon);

		const info = document.createElement("div");
		info.className = "craft-option-info";

		const name = document.createElement("div");
		name.className = "craft-option-name";
		name.textContent = spec.name;
		info.appendChild(name);

		const type = document.createElement("div");
		type.className = "craft-option-type";
		type.textContent = spec.type;
		info.appendChild(type);

		header.appendChild(info);

		const resources = document.createElement("div");
		resources.className = "craft-option-resources";

		const resourceItem = this.createCraftResourceItem(resourceId, spec);
		resources.appendChild(resourceItem);

		option.appendChild(header);
		option.appendChild(resources);

		return option;
	}

	// Create a single resource item to be used in a crafting option
	private createCraftResourceItem(resourceId: string, spec: ResourceSpec): HTMLElement {
		const item = document.createElement("div");
		item.className = "craft-resource-item";

		const icon = document.createElement("div");
		icon.className = "craft-resource-icon";
		icon.textContent = spec.iconUrl;
		item.appendChild(icon);

		const name = document.createElement("div");
		name.className = "craft-resource-name";
		name.textContent = spec.name;
		item.appendChild(name);

		const count = document.createElement("div");
		count.className = "craft-resource-count";
		count.textContent = "0/0";
		item.appendChild(count);

		return item;
	}

	/**
	 * Builds the resource selection options.
	 * Only called when available resources change (rare).
	 */
	private buildResourceOptions(): void {
		this.optionRow.innerHTML = "";
	}

	/**
	 * Creates a single resource selection card.
	 * @param resourceId - The resource identifier
	 * @param spec - The resource specification
	 */
	private createResourceCard(resourceId: string, spec: ResourceSpec): { card: HTMLElement; costsEl: HTMLElement; timeEl: HTMLElement } {
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

		// Time (show real craft time)
		const timeEl = document.createElement("div");
		timeEl.className = "bs-recipe-time";
		const craftInfo = this.context.resources.getCraftingData(resourceId);
		timeEl.textContent = `${Math.ceil(craftInfo.time)}s`;
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

		return { card, costsEl, timeEl };
	}

	/**
	 * Updates the cost display for a resource card.
	 * Called on hover to ensure costs are always current.
	 */
	private updateCardCosts(costsEl: HTMLElement, spec: ResourceSpec): void {
		costsEl.innerHTML = "";

		const craftInfo = this.context.resources.getCraftingData(spec.id);
		craftInfo.costs.forEach((req) => {
			if (!req.resource) return;

			const have = this.context.resources.getResourceQuantity(req.resource);
			const reqSpec = Resource.getSpec(req.resource);

			const item = document.createElement("div");
			item.className = "bs-cost-item";

			const icon = document.createElement("img");
			icon.src = reqSpec?.iconUrl ?? "";
			item.appendChild(icon);

			const text = document.createElement("span");
			text.textContent = `${formatNumberShort(req.quantity)} / ${formatNumberShort(have)}`;
			if (have < req.quantity) text.classList.add("insufficient");
			item.appendChild(text);

			costsEl.appendChild(item);
		});
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

				// Update progress bar max value using real craft time
				const craftInfo = this.context.resources.getCraftingData(slot.resourceId);
				this.progressBar.setMax(craftInfo.time);

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
			const craftInfo = this.context.resources.getCraftingData(spec.id);
			this.progressBar.setValue(craftInfo.time - slot.progress);
			this.progressText.textContent = `${Math.ceil(slot.progress)}s`;
		}
	}

	/**
	 * Updates resource level and XP only if changed.
	 */
	private updateResourceData(resourceId: string): void {
		const data = this.context.resources.getResourceData(resourceId);
		const tier = Resource.getSpec(resourceId)?.tier ?? 1;
		if (!data) return;

		// Update level if changed
		if (data.level !== this.lastLevel) {
			this.lastLevel = data.level;
			this.levelEl.textContent = `Lv ${data.level}`;

			// Update XP bar max value
			const xpNeeded = BalanceCalculators.getResourceXPThreshold(data.level, tier);
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

		const craftInfo = this.context.resources.getCraftingData(spec.id);
		craftInfo.costs.forEach((req) => {
			if (!req.resource) return;

			const have = this.context.resources.getResourceQuantity(req.resource);
			const reqSpec = Resource.getSpec(req.resource);

			const item = document.createElement("div");
			item.className = "bs-cost-item";

			const icon = document.createElement("img");
			icon.src = reqSpec?.iconUrl ?? "";
			item.appendChild(icon);

			const text = document.createElement("span");
			text.textContent = `${formatNumberShort(req.quantity)} / ${formatNumberShort(have)}`;
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
			// Just update the costs and times on existing cards
			this.recipeCards.forEach((cardData, resourceId) => {
				const spec = Resource.getSpec(resourceId);
				if (spec) {
					this.updateCardCosts(cardData.costsEl, spec);
					const info = this.context.resources.getCraftingData(resourceId);
					cardData.timeEl.textContent = `${Math.ceil(info.time)}s`;
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
