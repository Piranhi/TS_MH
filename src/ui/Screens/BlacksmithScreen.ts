import { bus } from "@/core/EventBus";
import { BaseScreen } from "./BaseScreen";
import Markup from "./blacksmith.html?raw";
import { bindEvent } from "@/shared/utils/busUtils";
import { Resource } from "@/features/inventory/Resource";
import { Tooltip } from "../components/Tooltip";
import { BlacksmithSlot } from "../components/BlacksmithSlot";
import { UpgradeSelectionContainer, UpgradeSelectionData } from "../components/UpgradeSelectionContainer";

interface ResourceRowData {
	element: HTMLElement;
	quantityEl: HTMLSpanElement;
	levelEl: HTMLSpanElement;
	lastQuantity: number;
	lastLevel: number;
}


/**
 * Optimized BlacksmithScreen that updates only what changes.
 * Uses component-based architecture to avoid rebuilding the UI.
 */
export class BlacksmithScreen extends BaseScreen {
	readonly screenName = "blacksmith";

	private slotGrid!: HTMLElement;
	private resourceList!: HTMLElement;
	private upgradeGrid!: HTMLElement;

	// Component instances
	private slotComponents: BlacksmithSlot[] = [];

	// Cached resource row elements for efficient updates
	private resourceRows: Map<string, ResourceRowData> = new Map();

        // Upgrade selection component
        private upgradeContainer!: UpgradeSelectionContainer;

	init() {
		this.addMarkuptoPage(Markup);
		this.slotGrid = this.byId("bsSlotGrid");
		this.resourceList = this.byId("bsResourceList");
		this.upgradeGrid = this.byId("bsUpgradeGrid");

		this.buildInitial();
		this.bindEvents();
	}

	show() {
		// Update everything when screen is shown
		this.updateAll();
	}

	hide() {
		// Cleanup tooltips when hidden
		Tooltip.instance.hide();
	}

	/**
	 * Builds the initial UI structure once.
	 * All future updates will modify existing elements.
	 */
	private buildInitial() {
                this.buildSlots();
                this.buildResourceRows();
                this.buildUpgradeContainer();
	}

	/**
	 * Binds event handlers for UI updates.
	 */
	private bindEvents() {
		// Update slots every tick
		bus.on("Game:UITick", () => this.updateSlots());

		// Update resources when they change
		bindEvent(this.eventBindings, "resources:changed", () => this.updateResourcesDisplay());

		// Full rebuild only when slots change (rare)
		bindEvent(this.eventBindings, "blacksmith:slots-changed", () => this.rebuildSlots());

                // Update upgrades when they change
                bindEvent(this.eventBindings, "blacksmith:upgrades-changed", () => this.refreshUpgrades());
                bindEvent(this.eventBindings, "resources:changed", () => this.refreshUpgrades());
	}

	/**
	 * Creates BlacksmithSlot components for each slot.
	 * Only called once during initialization or when slot count changes.
	 */
	private buildSlots() {
		// Clear existing components
		this.slotComponents.forEach((slot) => slot.destroy());
		this.slotComponents = [];
		this.slotGrid.innerHTML = "";

		const slots = this.context.blacksmith.getSlots();

		slots.forEach((_, idx) => {
			const container = document.createElement("div");
			this.slotGrid.appendChild(container);

			const component = new BlacksmithSlot(container, idx);
			this.slotComponents.push(component);
		});
	}

	/**
	 * Updates all slot components.
	 * Called every tick - components handle their own efficient updates.
	 */
	private updateSlots() {
		this.slotComponents.forEach((slot) => slot.update());
	}

	/**
	 * Rebuilds slots only when the number of slots changes.
	 * Rare event - typically only happens with upgrades.
	 */
	private rebuildSlots() {
		const currentCount = this.slotComponents.length;
		const newCount = this.context.blacksmith.getSlots().length;

		if (currentCount !== newCount) {
			this.buildSlots();
		}
	}

	/**
	 * Creates resource row elements once.
	 * Updates will modify these elements rather than recreating them.
	 */
	private buildResourceRows() {
		this.resourceList.innerHTML = "";
		this.resourceRows.clear();

		const resources = this.context.resources.getAllResources();

		for (let [id, data] of resources) {
			if (!data.isUnlocked || data.infinite) continue;

			const spec = Resource.getSpec(id);
			if (!spec) continue;

			const row = this.createResourceRow(id, spec, data);
			this.resourceList.appendChild(row.element);
			this.resourceRows.set(id, row);
		}
	}

	/**
	 * Creates a single resource row with cached element references.
	 */
	private createResourceRow(id: string, spec: any, data: any): ResourceRowData {
		const row = document.createElement("div");
		row.className = "blacksmith-resource-row";

		const img = document.createElement("img");
		img.src = spec.iconUrl;
		row.appendChild(img);

		const qty = document.createElement("span");
		qty.textContent = String(data.quantity);
		row.appendChild(qty);

		const lvl = document.createElement("span");
		lvl.className = "blacksmith-resource-level";
		lvl.textContent = `Lv ${data.level}`;
		row.appendChild(lvl);

		// Tooltip handling
		row.addEventListener("mouseenter", () => {
			Tooltip.instance.show(row, {
				icon: spec.iconUrl,
				name: spec.name,
				description: spec.description,
			});
		});
		row.addEventListener("mouseleave", () => Tooltip.instance.hide());

		return {
			element: row,
			quantityEl: qty,
			levelEl: lvl,
			lastQuantity: data.quantity,
			lastLevel: data.level,
		};
	}

	/**
	 * Updates only the resource values that have changed.
	 * Much more efficient than rebuilding all rows.
	 */
	private updateResourcesDisplay() {
		const resources = this.context.resources.getAllResources();

		// Check for new resources that need rows
		for (let [id, data] of resources) {
			if (!data.isUnlocked || data.infinite) continue;

			if (!this.resourceRows.has(id)) {
				// New resource unlocked - add its row
				const spec = Resource.getSpec(id);
				if (spec) {
					const row = this.createResourceRow(id, spec, data);
					this.resourceList.appendChild(row.element);
					this.resourceRows.set(id, row);
				}
			}
		}

		// Update existing rows
		this.resourceRows.forEach((row, id) => {
			const data = resources.get(id);
			if (!data) {
				// Resource no longer exists - remove row
				row.element.remove();
				this.resourceRows.delete(id);
				return;
			}

			// Only update if values changed
			if (data.quantity !== row.lastQuantity) {
				row.quantityEl.textContent = String(data.quantity);
				row.lastQuantity = data.quantity;
			}

			if (data.level !== row.lastLevel) {
				row.levelEl.textContent = `Lv ${data.level}`;
				row.lastLevel = data.level;
			}
		});

		// Notify slots that resources changed (for cost updates)
		this.slotComponents.forEach((slot) => slot.onResourcesChanged());
	}

	/**
	 * Creates upgrade cards once.
	 * Updates will modify these elements rather than recreating them.
	 */
        private buildUpgradeContainer() {
                this.upgradeContainer = new UpgradeSelectionContainer({
                        container: this.upgradeGrid,
                        upgrades: this.getUpgradeData(),
                        onUpgradeClick: (id) => this.context.blacksmith.purchaseUpgrade(id),
                });
        }

        private refreshUpgrades() {
                if (this.upgradeContainer) {
                        this.upgradeContainer.setUpgrades(this.getUpgradeData());
                }
        }

        private getUpgradeData(): UpgradeSelectionData[] {
                return this.context.blacksmith.getUpgrades().map((upg) => ({
                        id: upg.id,
                        title: upg.name,
                        description: upg.description,
                        costs: upg.cost.map((c) => ({
                                icon: Resource.getSpec(c.resource)?.iconUrl ?? "",
                                amount: c.quantity,
                        })),
                        purchased: upg.isPurchased,
                        canAfford: this.context.resources.canAfford(upg.cost),
                }));
        }

	/**
	 * Updates all UI elements.
	 * Called when screen is shown or major changes occur.
	 */
        private updateAll() {
                this.updateSlots();
                this.updateResourcesDisplay();
                this.refreshUpgrades();
        }

	/**
	 * Cleanup when screen is destroyed.
	 */
	destroy() {
		this.slotComponents.forEach((slot) => slot.destroy());
		super.destroy();
	}
}
