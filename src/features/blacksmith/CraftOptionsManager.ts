import { Resource } from "@/features/inventory/Resource";
import { GameContext } from "@/core/GameContext";

/**
 * CraftOptionManager - Manages craft option elements and keeps resource counts updated
 * Handles click events and periodic updates for resource availability
 */
export class CraftOptionManager {
	private optionElements: Map<string, HTMLElement> = new Map();
	private clickHandlers: Map<string, () => void> = new Map();
	private updateInterval: number | null = null;

	constructor(private context: GameContext, private onSelect: (resourceId: string) => void) {}

	/**
	 * Add a craft option element to be managed
	 */
	addOption(resourceId: string, element: HTMLElement): void {
		this.optionElements.set(resourceId, element);

		// Create and store the click handler
		const handler = () => {
			// Check if we can craft before allowing selection
			const spec = Resource.getSpec(resourceId);
			if (!spec) return;

			const canCraft =
				spec.costs?.every((cost) => {
					const have = this.context.resources.getResource(cost.resource)?.amount || 0;
					return have >= cost.amount;
				}) ?? true;

			if (canCraft) {
				this.onSelect(resourceId);
			}
		};

		this.clickHandlers.set(resourceId, handler);

		// Add the event listener
		element.addEventListener("click", handler);
	}

	/**
	 * Update all visible resource counts and availability states
	 */
	updateResourceCounts(): void {
		this.optionElements.forEach((element, resourceId) => {
			const resourceItems = element.querySelectorAll(".craft-resource-item");
			const spec = Resource.getSpec(resourceId);

			if (!spec?.costs) return;

			let canCraftAll = true;

			// Update each resource requirement
			spec.costs.forEach((cost, index) => {
				const resourceEl = resourceItems[index];
				if (!resourceEl) return;

				const have = this.context.resources.getResource(cost.resource)?.amount || 0;
				const countEl = resourceEl.querySelector(".craft-resource-count") as HTMLElement;

				if (countEl) {
					countEl.textContent = `${have}/${cost.amount}`;
					countEl.className = "craft-resource-count " + (have >= cost.amount ? "sufficient" : "insufficient");
				}

				if (have < cost.amount) {
					canCraftAll = false;
				}
			});

			// Update option availability
			element.classList.toggle("unavailable", !canCraftAll);
		});
	}

	/**
	 * Start auto-updating resource counts
	 */
	startUpdating(intervalMs: number = 100): void {
		this.stopUpdating();
		this.updateResourceCounts(); // Initial update

		this.updateInterval = window.setInterval(() => {
			this.updateResourceCounts();
		}, intervalMs);
	}

	/**
	 * Stop auto-updating
	 */
	stopUpdating(): void {
		if (this.updateInterval !== null) {
			clearInterval(this.updateInterval);
			this.updateInterval = null;
		}
	}

	/**
	 * Clean up all listeners and references
	 */
	cleanup(): void {
		this.stopUpdating();

		// Remove all event listeners
		this.optionElements.forEach((element, resourceId) => {
			const handler = this.clickHandlers.get(resourceId);
			if (handler) {
				element.removeEventListener("click", handler);
			}
		});

		// Clear maps
		this.optionElements.clear();
		this.clickHandlers.clear();
	}
}
