import { UIBase } from "./UIBase";
import { Resource } from "@/features/inventory/Resource";
import { CraftOptionManager } from "@/features/blacksmith/CraftOptionsManager";

/**
 * CraftSelectionModal - Handles showing available crafting options
 * Uses CraftOptionManager to keep resource counts updated
 */
export class CraftSelectionModal extends UIBase {
	private optionManager: CraftOptionManager;
	private onSelect: (resourceId: string) => void;
	private onClose: () => void;

	constructor(container: HTMLElement, onSelect: (resourceId: string) => void, onClose: () => void) {
		super();
		this.element = container;
		this.onSelect = onSelect;
		this.onClose = onClose;

		this.optionManager = new CraftOptionManager(this.context, (resourceId) => this.handleSelection(resourceId));

		this.build();
	}

	protected build(): void {
		this.element.className = "craft-selection-modal";
		this.element.innerHTML = this.getTemplate();

		// Bind events
		const backButton = this.$("#back-button");
		this.bindDomEvent(backButton, "click", () => this.close());

		// Populate options
		this.populateOptions();

		// Start auto-updating resource counts
		this.optionManager.startUpdating();
	}

	private getTemplate(): string {
		return `
            <div class="selection-header">
                <button class="back-button" id="back-button">
                    <span class="back-icon">←</span>
                </button>
                <div class="selection-title">Select Item to Craft</div>
            </div>
            
            <div class="craft-options-list" id="craft-options-list">
                <!-- Options will be populated here -->
            </div>
        `;
	}

	private populateOptions(): void {
		const optionsList = this.$("#craft-options-list");
		const options = this.getCraftingOptions();

		options.forEach((resourceId) => {
			const optionEl = this.createCraftOption(resourceId);
			if (optionEl) {
				optionsList.appendChild(optionEl);
				this.optionManager.addOption(resourceId, optionEl);
			}
		});
	}

	private getCraftingOptions(): string[] {
		const resources = this.context.resources.getAllResources();
		return Array.from(resources.entries())
			.filter(([id, d]) => id !== "raw_ore" && d.isUnlocked && !d.infinite)
			.map(([id]) => id);
	}

	private createCraftOption(resourceId: string): HTMLElement | null {
		const spec = Resource.getSpec(resourceId);
		if (!spec) return null;

		const option = document.createElement("div");
		option.className = "craft-option";

		// Initial affordability check
		const canCraft =
			spec.costs?.every((cost) => {
				const have = this.context.resources.getResource(cost.resource)?.amount || 0;
				return have >= cost.amount;
			}) ?? true;

		if (!canCraft) {
			option.classList.add("unavailable");
		}

		// Create option content
		const header = document.createElement("div");
		header.className = "craft-option-header";

		const icon = document.createElement("div");
		icon.className = "craft-option-icon";
		icon.innerHTML = `<img src="${spec.iconUrl}" alt="${spec.name}">`;
		header.appendChild(icon);

		const info = document.createElement("div");
		info.className = "craft-option-info";
		info.innerHTML = `
            <div class="craft-option-name">${spec.name}</div>
            <div class="craft-option-type">Resource • ${spec.tier ? `Tier ${spec.tier}` : "Basic"}</div>
        `;
		header.appendChild(info);

		option.appendChild(header);

		// Resources section
		const resources = document.createElement("div");
		resources.className = "craft-option-resources";

		spec.costs?.forEach((cost) => {
			const resourceItem = this.createResourceItem(cost);
			if (resourceItem) {
				resources.appendChild(resourceItem);
			}
		});

		option.appendChild(resources);

		return option;
	}

	private createResourceItem(cost: { resource: string; amount: number }): HTMLElement | null {
		const resourceSpec = Resource.getSpec(cost.resource);
		if (!resourceSpec) return null;

		const have = this.context.resources.getResource(cost.resource)?.amount || 0;
		const sufficient = have >= cost.amount;

		const item = document.createElement("div");
		item.className = "craft-resource-item";

		item.innerHTML = `
            <div class="craft-resource-icon">
                <img src="${resourceSpec.iconUrl}" alt="${resourceSpec.name}">
            </div>
            <div class="craft-resource-name">${resourceSpec.name}</div>
            <div class="craft-resource-count ${sufficient ? "sufficient" : "insufficient"}">
                ${have}/${cost.amount}
            </div>
        `;

		return item;
	}

	private handleSelection(resourceId: string): void {
		this.onSelect(resourceId);
		this.close();
	}

	private close(): void {
		this.onClose();
		this.destroy();
	}

	protected cleanUp(): void {
		this.optionManager.cleanup();
	}
}
