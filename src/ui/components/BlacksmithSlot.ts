import { ProgressBar } from "../components/ProgressBar";
import { Resource } from "@/features/inventory/Resource";
import { CraftSlot } from "@/features/settlement/BlacksmithManager";
import { UIBase } from "./UIBase";
import { Tooltip, TooltipListItem } from "./Tooltip";
import { BalanceCalculators } from "@/balance/GameBalance";
import { formatNumberShort } from "@/shared/utils/stringUtils";

/**
 * BlacksmithSlot - Handles the display of a single crafting slot
 * Responsible only for showing the current state (empty/crafting)
 * Does NOT handle selection - that's delegated to callbacks
 */
export class BlacksmithSlot extends UIBase {
	private slotIndex: number;

	// Cached DOM elements
	private slotEl!: HTMLElement;
	private emptyEl!: HTMLElement;
	private craftingEl!: HTMLElement;

	// Crafting state elements
	private iconEl!: HTMLImageElement;
	private nameEl!: HTMLElement;
	private typeEl!: HTMLElement;
	private levelEl!: HTMLElement;
	private xpEl!: HTMLElement;
	private xpBar!: ProgressBar;
	private craftProgressBar!: ProgressBar;
	private progressTimeEl!: HTMLElement;
	private resourcesEl!: HTMLElement;

	// Callbacks
	private onSlotClick?: () => void;

	// Cached state
	private currentResourceId: string | null = null;
	private lastLevel: number = -1;
	private lastXp: number = -1;
	private lastProgress: number = -1;

	constructor(container: HTMLElement, slotIndex: number, onSlotClick?: () => void) {
		super();
		this.element = container;
		this.slotIndex = slotIndex;
		this.onSlotClick = onSlotClick;
		this.build();
	}

	protected build(): void {
		this.element.className = "blacksmith-slot-wrapper";
		this.element.innerHTML = this.getTemplate();

		// Cache all elements
		this.slotEl = this.$(".blacksmith-slot");
		this.emptyEl = this.$(".blacksmith-slot-empty");
		this.craftingEl = this.$(".blacksmith-slot-crafting");

		// Crafting elements
		this.iconEl = this.$("#slot-icon") as HTMLImageElement;
		this.nameEl = this.$("#slot-name");
		this.typeEl = this.$("#slot-type");
		this.levelEl = this.$("#slot-level");
		this.xpEl = this.$("#slot-xp");
		this.resourcesEl = this.$("#slot-resources");
		this.progressTimeEl = this.$("#slot-progress-time");

		// XP bar - create the fill element since ProgressBar might override
		const xpBarContainer = this.$("#slot-xp-bar");
		this.xpBar = new ProgressBar({
			container: xpBarContainer,
			maxValue: 1,
			smooth: true,
			showLabel: false,
		});

		// Craft progress bar
		const progressBarContainer = this.$("#slot-progress-bar");
		this.craftProgressBar = new ProgressBar({
			container: progressBarContainer,
			maxValue: 1,
			smooth: true,
			showLabel: false,
		});

		// Add the glassmorphism progress fill styles
		const xpFill = xpBarContainer.querySelector(".progress-fill");
		if (xpFill) {
			xpFill.classList.add("slot-xp-fill");
		}

		const progressFill = progressBarContainer.querySelector(".progress-fill");
		if (progressFill) {
			progressFill.classList.add("progress-fill");
		}

		// Events
		this.bindDomEvent(this.slotEl, "click", () => this.onSlotClick?.());
		this.bindDomEvent(this.slotEl, "mouseenter", () => this.createTooltip());
		this.bindDomEvent(this.slotEl, "mouseleave", () => Tooltip.instance.hide());
	}

	private getTemplate(): string {
		return `
            <div class="blacksmith-slot empty">
                <!-- Empty State -->
                <div class="blacksmith-slot-empty">
                    <div class="empty-text">Click to select item to craft</div>
                </div>
                
                <!-- Crafting State -->
                <div class="blacksmith-slot-crafting" style="display: none;">
                    <div class="blacksmith-slot-header">
                        <div class="blacksmith-slot-icon" id="slot-icon-wrapper">
                            <img id="slot-icon" alt="">
                        </div>
                        <div class="blacksmith-slot-info">
                            <div class="blacksmith-slot-details">
                                <div class="blacksmith-slot-name" id="slot-name"></div>
                                <div class="blacksmith-slot-type" id="slot-type"></div>
                            </div>
                            <div class="blacksmith-slot-level-info">
                                <div class="blacksmith-slot-level" id="slot-level"></div>
                                <div class="blacksmith-slot-xp" id="slot-xp"></div>
                                <div class="blacksmith-slot-xp-bar" id="slot-xp-bar">
                                    <div class="blacksmith-slot-xp-fill" id="slot-xp-fill"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="blacksmith-slot-progress">
                        <div class="blacksmith-slot-progress-info">
                            <span>Crafting Progress</span>
                            <span id="slot-progress-time"></span>
                        </div>
                        <div class="blacksmith-slot-progress-bar" id="slot-progress-bar">
                            <div class="blacksmith-slot-progress-fill" id="slot-progress-fill"></div>
                        </div>
                    </div>
                    
                    <div class="blacksmith-slot-resources" id="slot-resources"></div>
                </div>
            </div>
        `;
	}

	/**
	 * Updates the slot display based on the current craft slot data
	 */
	public update(): void {
		const slot = this.context.blacksmith.getSlots()[this.slotIndex];
		if (!slot) return;

		// Check if resource changed
		if (slot.resourceId !== this.currentResourceId) {
			this.currentResourceId = slot.resourceId;
			this.onResourceChanged(slot);
		}

		// Update progress and resource data if crafting
		if (slot.resourceId) {
			this.updateProgress(slot);
			this.updateResourceData(slot.resourceId);
			this.updateResourceCosts(slot.resourceId);
		}
	}

	private onResourceChanged(slot: CraftSlot): void {
		if (!slot.resourceId) {
			// Show empty state
			this.slotEl.classList.add("empty");
			this.slotEl.classList.remove("crafting");
			this.emptyEl.style.display = "flex";
			this.craftingEl.style.display = "none";
			return;
		}

		// Show crafting state
		this.slotEl.classList.remove("empty");
		this.slotEl.classList.add("crafting");
		this.emptyEl.style.display = "none";
		this.craftingEl.style.display = "block";

		const spec = Resource.getSpec(slot.resourceId);
		if (!spec) return;

		// Update basic info
		this.iconEl.src = spec.iconUrl || "";
		this.iconEl.alt = spec.name || "";
		this.nameEl.textContent = spec.name;
		this.typeEl.textContent = `Resource • ${spec.tier ? `Tier ${spec.tier}` : "Basic"}`;

		// Update progress bar max
		const craftInfo = this.context.resources.getCraftingData(slot.resourceId);
		this.craftProgressBar.setMax(craftInfo.time);

		// Build resource costs display
		this.buildResourceCosts(spec);

		// Reset progress tracking
		this.lastProgress = -1;
	}

	private buildResourceCosts(spec: any): void {
		this.resourcesEl.innerHTML = "";

		const craftInfo = this.context.resources.getCraftingData(spec.id);
		craftInfo.costs.forEach((cost) => {
			const resourceSpec = Resource.getSpec(cost.resource);
			if (!resourceSpec) return;

			const item = document.createElement("div");
			item.className = "resource-item";
			item.setAttribute("data-resource", cost.resource);
			item.setAttribute("data-amount", cost.quantity.toString());

			const icon = document.createElement("div");
			icon.className = "resource-icon";
			const iconImg = document.createElement("img");
			iconImg.src = resourceSpec.iconUrl;
			iconImg.alt = resourceSpec.name;
			icon.appendChild(iconImg);
			item.appendChild(icon);

			const name = document.createElement("div");
			name.className = "resource-name";
			name.textContent = resourceSpec.name;
			item.appendChild(name);

			const count = document.createElement("div");
			count.className = "resource-count";
			count.textContent = `0/${cost.quantity}`;
			item.appendChild(count);

			this.resourcesEl.appendChild(item);
		});
	}

	private updateResourceCosts(resourceId: string): void {
		const items = this.resourcesEl.querySelectorAll(".resource-item");
		items.forEach((item) => {
			const resource = item.getAttribute("data-resource");
			const amount = parseInt(item.getAttribute("data-amount") || "0");
			if (!resource) return;

			const have = this.context.resources.getResourceQuantity(resource) || 0;
			const countEl = item.querySelector(".resource-count");
			if (countEl) {
				countEl.textContent = `${amount}/${formatNumberShort(have)}`;
				countEl.className = "resource-count " + (have >= amount ? "sufficient" : "insufficient");
			}
		});
	}

	private updateProgress(slot: CraftSlot): void {
		if (slot.progress === this.lastProgress) return;
		this.lastProgress = slot.progress;

		const spec = Resource.getSpec(slot.resourceId!);
		if (!spec) return;

		const craftInfo = this.context.resources.getCraftingData(spec.id);
		const progressValue = craftInfo.time - slot.progress;
		this.craftProgressBar.setValue(progressValue);

		// Calculate percentage for display
		const percentage = Math.round((progressValue / craftInfo.time) * 100);

		const timeRemaining = Math.ceil(slot.progress);
		if (timeRemaining > 0) {
			// Format time as minutes:seconds if over 60 seconds
			if (timeRemaining >= 60) {
				const minutes = Math.floor(timeRemaining / 60);
				const seconds = timeRemaining % 60;
				this.progressTimeEl.textContent = `${minutes}:${seconds.toString().padStart(2, "0")} remaining`;
			} else {
				this.progressTimeEl.textContent = `${timeRemaining}s remaining`;
			}
		} else {
			this.progressTimeEl.textContent = "Complete!";
		}
	}

	private updateResourceData(resourceId: string): void {
		const data = this.context.resources.getResourceData(resourceId);
		if (!data) return;

		const tier = Resource.getSpec(resourceId)?.tier ?? 1;

		// Update level if changed
		if (data.level !== this.lastLevel) {
			this.lastLevel = data.level;
			this.levelEl.textContent = `Lv. ${data.level}`;

			// Update XP bar max
			const xpNeeded = BalanceCalculators.getResourceXPThreshold(data.level, tier);
			this.xpBar.setMax(xpNeeded);
		}

		// Update XP if changed
		if (data.xp !== this.lastXp) {
			this.lastXp = data.xp;
			const xpNeeded = BalanceCalculators.getResourceXPThreshold(data.level, tier);
			this.xpBar.setValue(data.xp);
			this.xpEl.textContent = `${data.xp} / ${xpNeeded} XP`;
		}
	}

	private createTooltip(): void {
		if (!this.currentResourceId) return;

		const resourceData = this.context.resources.getResourceData(this.currentResourceId);
		const currentLevel = resourceData?.level || 1;

		// Build upgrade list
		const upgrades: TooltipListItem[] = [];

		const upgradeArray = this.context.resources.getAllUpgrades(this.currentResourceId);
		upgradeArray.forEach((upgrade) => {
			upgrades.push({
				text: `Lvl ${upgrade.level}: ${upgrade.displayText}`,
				className: currentLevel >= upgrade.level ? "upgrade-unlocked" : "upgrade-locked",
			});
		});

		const resourceSpec = Resource.getSpec(this.currentResourceId);
		if (resourceSpec?.unlocks) {
			resourceSpec.unlocks.forEach((unlock) => {
				const unlockedSpec = Resource.getSpec(unlock.id);
				upgrades.push({
					text: `Lvl ${unlock.level}: Unlock ${unlockedSpec?.name || unlock.id}`,
					className: currentLevel >= unlock.level ? "upgrade-unlocked" : "upgrade-locked",
				});
			});
		}

		upgrades.sort((a, b) => {
			const aLevel = parseInt(a.text.match(/Lvl (\d+)/)?.[1] || "0");
			const bLevel = parseInt(b.text.match(/Lvl (\d+)/)?.[1] || "0");
			return aLevel - bLevel;
		});

		Tooltip.instance.show(this.element, {
			icon: this.iconEl.src,
			type: "Resource Upgrades",
			name: resourceSpec?.name || "",
			list: upgrades,
		});
	}

	protected cleanUp(): void {
		this.craftProgressBar?.destroy();
		this.xpBar?.destroy();
	}
}
