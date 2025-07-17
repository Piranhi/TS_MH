import { bus } from "@/core/EventBus";
import { BaseScreen } from "./BaseScreen";
import Markup from "./blacksmith.html?raw";
import { bindEvent } from "@/shared/utils/busUtils";
import { Resource } from "@/features/inventory/Resource";
import { Tooltip } from "../components/Tooltip";
import { BlacksmithSlot } from "../components/BlacksmithSlot";
import { CraftSelectionModal } from "../components/CraftSelectionModal";
import { UpgradeSelectionContainer, UpgradeSelectionData } from "../components/UpgradeSelectionContainer";
import { BuildingStatus } from "../components/BuildingStatus";
import { formatNumberShort } from "@/shared/utils/stringUtils";
import { ResourceData, ResourceSpec } from "@/shared/types";

interface ResourceRowData {
	element: HTMLElement;
	quantityEl: HTMLSpanElement;
	levelEl: HTMLSpanElement;
	lastQuantity: number;
	lastLevel: number;
}

/**
 * BlacksmithScreen - Main screen coordinator
 * Manages slots, resources display, and upgrades
 */
export class BlacksmithScreen extends BaseScreen {
	readonly screenName = "blacksmith";

	private slotGrid!: HTMLElement;
	private resourceList!: HTMLElement;
	private upgradeGrid!: HTMLElement;

	// Component instances
	private slotComponents: BlacksmithSlot[] = [];
	private currentModal: CraftSelectionModal | null = null;

	// Cached resource row elements
	private resourceRows: Map<string, ResourceRowData> = new Map();

	// Upgrade selection component
	private upgradeContainer!: UpgradeSelectionContainer;

	// Raw Ore progress elements
	private rawOreFill!: HTMLElement;
	private rawOreOutput!: HTMLSpanElement;

	init() {
		const root = this.addMarkuptoPage(Markup);
		const statusEl = root.querySelector("#bs-building-status") as HTMLElement;
		const building = this.context.settlement.getBuilding("blacksmith");
		if (building && statusEl) new BuildingStatus(statusEl, building);

		this.slotGrid = this.byId("bsSlotGrid");
		this.resourceList = this.byId("bsResourceList");
		this.upgradeGrid = this.byId("bsUpgradeGrid");

		// Raw ore progress elements
		this.rawOreFill = this.byId("bsRawOreFill");
		this.rawOreOutput = this.byId("bsRawOreOutput") as HTMLSpanElement;

		this.buildInitial();
		this.bindEvents();
	}

	show() {
		// Update everything when screen is shown
		this.updateAll();
	}

	hide() {
		// Cleanup tooltips and modals when hidden
		Tooltip.instance.hide();
		this.closeModal();
	}

	private buildInitial() {
		this.buildSlots();
		this.buildResourceRows();
		this.buildUpgradeContainer();
		this.updateRawOre();
	}

	private bindEvents() {
		// Update slots every tick
		bus.on("Game:UITick", () => {
			this.updateSlots();
			this.updateRawOre();
		});

		// Update resources when they change
		bindEvent(this.eventBindings, "resources:changed", () => this.updateResourcesDisplay());

		// Full rebuild only when slots change (rare)
		bindEvent(this.eventBindings, "blacksmith:slots-changed", () => this.rebuildSlots());

		// Update upgrades when they change
		bindEvent(this.eventBindings, "blacksmith:upgrades-changed", () => this.refreshUpgrades());
		bindEvent(this.eventBindings, "resources:changed", () => this.refreshUpgrades());
	}

	/**
	 * Creates BlacksmithSlot components for each slot
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

			const component = new BlacksmithSlot(container, idx, () => this.handleSlotClick(idx));
			this.slotComponents.push(component);
		});
	}

	/**
	 * Handle clicking on a slot - show selection modal
	 */
	private handleSlotClick(slotIndex: number): void {
		console.log("Slot clicked:", slotIndex);

		// Close any existing modal
		this.closeModal();

		// Create modal container
		const modalContainer = document.createElement("div");
		modalContainer.className = "blacksmith-modal-overlay";
		document.body.appendChild(modalContainer);

		console.log("Modal container added to body");

		// Add click handler to close on background click
		modalContainer.addEventListener("click", (e) => {
			if (e.target === modalContainer) {
				this.closeModal();
			}
		});

		// Create the inner modal wrapper
		const modalWrapper = document.createElement("div");
		modalWrapper.className = "craft-selection-modal-wrapper";
		modalContainer.appendChild(modalWrapper);

		// Create selection modal
		this.currentModal = new CraftSelectionModal(
			modalWrapper,
			(resourceId) => {
				console.log("Resource selected:", resourceId);
				this.context.blacksmith.setSlotResource(slotIndex, resourceId);
				this.closeModal();
			},
			() => this.closeModal()
		);

		console.log("Modal created");
	}

	/**
	 * Close the current modal if any
	 */
	private closeModal(): void {
		if (this.currentModal) {
			const container = this.currentModal.element.parentElement; // Get the overlay
			this.currentModal.destroy();
			this.currentModal = null;
			if (container) {
				container.remove();
			}
		}
	}

	/**
	 * Updates all slot components
	 */
	private updateSlots() {
		this.slotComponents.forEach((slot) => slot.update());
	}

	/**
	 * Rebuilds slots only when the number changes
	 */
	private rebuildSlots() {
		const currentCount = this.slotComponents.length;
		const newCount = this.context.blacksmith.getSlots().length;

		if (currentCount !== newCount) {
			this.buildSlots();
		}
	}

	/**
	 * Creates resource row elements once
	 */
	private buildResourceRows() {
		this.resourceList.innerHTML = "";
		this.resourceRows.clear();

		const resources = this.context.resources.getAllResources();

		for (const [id, data] of resources) {
			if (!data.isUnlocked || data.infinite) continue;

			const spec = Resource.getSpec(id);
			if (!spec) continue;

			const row = this.createResourceRow(id, spec, data);
			this.resourceList.appendChild(row.element);
			this.resourceRows.set(id, row);
		}
	}

	private createResourceRow(id: string, spec: ResourceSpec, data: ResourceData): ResourceRowData {
		const row = document.createElement("div");
		row.className = "resource-item";

		const img = document.createElement("img");
		img.src = spec.iconUrl;
		img.className = "resource-icon";
		row.appendChild(img);

		const info = document.createElement("div");
		info.className = "resource-info";
		row.appendChild(info);

		const name = document.createElement("div");
		name.className = "resource-name";
		name.textContent = spec.name;
		info.appendChild(name);

		const details = document.createElement("div");
		details.className = "resource-details";
		info.appendChild(details);

		const quantity = document.createElement("span");
		quantity.className = "resource-quantity";
		quantity.textContent = formatNumberShort(data.quantity, 0, true);
		details.appendChild(quantity);

		const separator = document.createElement("span");
		separator.className = "resource-separator";
		separator.textContent = " • ";
		details.appendChild(separator);

		const level = document.createElement("span");
		level.className = "resource-level";
		level.textContent = `Lv. ${data.level}`;
		details.appendChild(level);

		// Tooltip handling
		row.addEventListener("mouseenter", () => {
			this.showResourceTooltip(row, id, spec, data);
		});
		row.addEventListener("mouseleave", () => Tooltip.instance.hide());

		return {
			element: row,
			quantityEl: quantity,
			levelEl: level,
			lastQuantity: data.quantity,
			lastLevel: data.level,
		};
	}

	private showResourceTooltip(element: HTMLElement, resourceId: string, spec: any, data: any): void {
		const tooltipData = {
			icon: spec.iconUrl,
			name: spec.name,
			type: "Resource",
			description: spec.description,
			list: this.getResourceUnlockList(resourceId, spec, data),
		};

		Tooltip.instance.show(element, tooltipData);
	}

	private getResourceUnlockList(resourceId: string, spec: any, data: any): string[] {
		const unlockList: string[] = [];

		if (spec.unlocks) {
			for (const unlock of spec.unlocks) {
				const unlockSpec = Resource.getSpec(unlock.id);
				if (unlockSpec) {
					if (data.level >= unlock.level) {
						unlockList.push(`✓ Unlocked ${unlockSpec.name} at level ${unlock.level}`);
					} else {
						unlockList.push(`🔒 Unlocks ${unlockSpec.name} at level ${unlock.level}`);
					}
				}
			}
		}

		return unlockList;
	}

	/**
	 * Updates only changed resource values
	 */
	private updateResourcesDisplay() {
		const resources = this.context.resources.getAllResources();

		// Check for new resources
		for (let [id, data] of resources) {
			if (!data.isUnlocked || data.infinite) continue;

			if (!this.resourceRows.has(id)) {
				// New resource unlocked
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
				// Resource removed
				row.element.remove();
				this.resourceRows.delete(id);
				return;
			}

			// Update values if changed
			if (data.quantity !== row.lastQuantity) {
				row.quantityEl.textContent = formatNumberShort(data.quantity, 0, true);
				row.lastQuantity = data.quantity;
			}

			if (data.level !== row.lastLevel) {
				row.levelEl.textContent = `Lv. ${data.level}`;
				row.lastLevel = data.level;

				// Update tooltip with new unlock info
				const spec = Resource.getSpec(id);
				if (spec) {
					this.updateResourceTooltip(row.element, id, spec, data);
				}
			}
		});
	}

	private updateResourceTooltip(element: HTMLElement, resourceId: string, spec: any, data: any): void {
		// Remove old listeners by cloning
		const newElement = element.cloneNode(true) as HTMLElement;
		element.parentNode?.replaceChild(newElement, element);

		// Add updated listeners
		newElement.addEventListener("mouseenter", () => {
			this.showResourceTooltip(newElement, resourceId, spec, data);
		});
		newElement.addEventListener("mouseleave", () => Tooltip.instance.hide());

		// Update row reference
		const rowData = this.resourceRows.get(resourceId);
		if (rowData) {
			rowData.element = newElement;
			// Re-cache the child elements
			rowData.quantityEl = newElement.querySelector(".resource-quantity") as HTMLSpanElement;
			rowData.levelEl = newElement.querySelector(".resource-level") as HTMLSpanElement;
		}
	}

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
			level: upg.currentLevel,
			maxLevel: upg.maxLevel,
			purchased: upg.isPurchased,
			canAfford: this.context.resources.canAfford(upg.cost),
		}));
	}

	private updateAll() {
		this.updateSlots();
		this.updateResourcesDisplay();
		this.refreshUpgrades();
		this.updateRawOre();
	}

	private updateRawOre() {
		if (!this.rawOreFill || !this.rawOreOutput) return;
		const status = this.context.blacksmith.getRawOreStatus();
		const pct = Math.min(1, Math.max(0, status.ratio));
		this.rawOreFill.style.width = `${pct * 100}%`;
		this.rawOreOutput.textContent = `+${status.orePerCycle}`;
	}

	destroy() {
		this.slotComponents.forEach((slot) => slot.destroy());
		this.closeModal();
		super.destroy();
	}
}
