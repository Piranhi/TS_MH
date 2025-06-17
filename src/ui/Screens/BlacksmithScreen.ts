import { bus } from "@/core/EventBus";
import { BaseScreen } from "./BaseScreen";
import Markup from "./blacksmith.html?raw";
import { bindEvent } from "@/shared/utils/busUtils";
import { Resource } from "@/features/inventory/Resource";
import { ProgressBar } from "../components/ProgressBar";
import { ProgressBarSimple } from "../components/ProgressBarSimple";
import { Tooltip } from "../components/Tooltip";
import { BlacksmithUpgrade } from "@/features/settlement/BlacksmithUpgrade";

interface SlotElements {
	container: HTMLElement;
	selectBtn: HTMLButtonElement;
	optionRow: HTMLElement;
	content: HTMLElement;
	icon: HTMLImageElement;
	level: HTMLElement;
	xpBar: ProgressBarSimple;
	xpText: HTMLElement;
	cost: HTMLElement;
	bar: ProgressBar;
	progressText: HTMLElement;
}

export class BlacksmithScreen extends BaseScreen {
	readonly screenName = "blacksmith";

	private slotGrid!: HTMLElement;
	private resourceList!: HTMLElement;
	private upgradeGrid!: HTMLElement;
	private slotEls: SlotElements[] = [];

	init() {
		this.addMarkuptoPage(Markup);
		this.slotGrid = this.byId("bsSlotGrid");
		this.resourceList = this.byId("bsResourceList");
		this.upgradeGrid = this.byId("bsUpgradeGrid");
		this.build();
		this.bindEvents();
	}
	show() {}
	hide() {}

	private build() {
		this.buildSlots();
		this.updateResourcesDisplay();
		this.updateUpgrades();
	}

	private bindEvents() {
		bus.on("Game:UITick", (delta) => this.handleTick(delta));
		bindEvent(this.eventBindings, "resources:changed", () => this.updateResourcesDisplay());
		bindEvent(this.eventBindings, "blacksmith:changed", () => this.build());
	}
	/**
	 * Builds and renders the blacksmith slots UI, including resource selection and progress indicators.
	 *
	 * This method clears the current slot grid, creates UI elements for each blacksmith slot,
	 * and populates them with selectable resource options, progress bars, and relevant information.
	 *
	 * For each slot:
	 * - Adds a "Choose" button to toggle resource selection.
	 * - Displays available resources (excluding "raw_ore", locked, or infinite resources) as selectable cards.
	 * - Shows resource icons, crafting costs, and crafting time for each option.
	 * - Handles resource selection and updates the slot accordingly.
	 * - Displays selected resource info, including icon, XP bar, level, and crafting progress.
	 *
	 * The created slot elements are stored in `this.slotEls` for later reference.
	 */
	private buildSlots() {
		this.slotGrid.innerHTML = "";
		this.slotEls = [];
		const slots = this.context.blacksmith.getSlots();
		const resources = this.context.resources.getAllResources();
		const available = Array.from(resources.entries())
			.filter(([id, d]) => id !== "raw_ore" && d.isUnlocked && !d.infinite)
			.map(([id]) => id);
                slots.forEach((slot, idx) => {
                        const wrapper = document.createElement("div");
                        wrapper.className = "blacksmith-slot-wrapper";
                        const el = document.createElement("div");
                        el.className = "blacksmith-slot";
                        wrapper.appendChild(el);

                        const selectBtn = document.createElement("button");
                        selectBtn.className = "bs-select-btn";
                        selectBtn.textContent = "Choose";
                        wrapper.appendChild(selectBtn);

			const content = document.createElement("div");
			content.className = "bs-slot-content";
			el.appendChild(content);

			const optionRow = document.createElement("div");
			optionRow.className = "bs-option-row";
			el.appendChild(optionRow);

			available.forEach((id) => {
				const spec = Resource.getSpec(id);
				if (!spec) return;
				const card = document.createElement("div");
				card.className = "bs-recipe-card";
				const img = document.createElement("img");
				img.src = spec.iconUrl;
				card.appendChild(img);
                        const costsEl = document.createElement("div");
                        costsEl.className = "bs-recipe-costs";
                        spec.requires.forEach((r) => {
                                if (!r.resource) return;
                                const have = this.context.resources.getResourceQuantity(r.resource);
                                const item = document.createElement("div");
                                item.className = "bs-cost-item";
                                const ic = document.createElement("img");
                                ic.src = Resource.getSpec(r.resource)?.iconUrl ?? "";
                                item.appendChild(ic);
                                const txt = document.createElement("span");
                                txt.textContent = `${have}/${r.quantity}`;
                                if (have < r.quantity) txt.classList.add("insufficient");
                                item.appendChild(txt);
                                costsEl.appendChild(item);
                        });
				card.appendChild(costsEl);
				const timeEl = document.createElement("div");
				timeEl.className = "bs-recipe-time";
				timeEl.textContent = `${spec.craftTime}s`;
				card.appendChild(timeEl);
				card.addEventListener("click", () => {
					this.context.blacksmith.setSlotResource(idx, id);
					el.classList.remove("choosing");
					this.handleTick(0);
				});
				optionRow.appendChild(card);
			});

			selectBtn.addEventListener("click", () => {
				el.classList.toggle("choosing");
			});

			const info = document.createElement("div");
			info.className = "bs-selected-info";
			const iconWrap = document.createElement("div");
			iconWrap.className = "bs-icon-wrapper";
			const icon = document.createElement("img");
			icon.className = "bs-resource-icon";
			iconWrap.appendChild(icon);
			const xpContainer = document.createElement("div");
			xpContainer.className = "bs-xp-bar-container";
			iconWrap.appendChild(xpContainer);
			const xpText = document.createElement("div");
			xpText.className = "bs-xp-text";
			xpContainer.appendChild(xpText);
			const xpBar = new ProgressBarSimple({ container: xpContainer, maxValue: 1, initialValue: 0 });
			info.appendChild(iconWrap);
			const lvlEl = document.createElement("div");
			lvlEl.className = "bs-level";
			info.appendChild(lvlEl);
			content.appendChild(info);

                        const costEl = document.createElement("div");
                        costEl.className = "bs-cost-icons";
                        content.appendChild(costEl);

			const barContainer = document.createElement("div");
			content.appendChild(barContainer);
			const progressText = document.createElement("div");
			progressText.className = "progress-text";
			barContainer.appendChild(progressText);
			const bar = new ProgressBar({ container: barContainer, maxValue: 1, initialValue: 0 });

                        this.slotGrid.appendChild(wrapper);
			this.slotEls.push({
				container: el,
				selectBtn,
				optionRow,
				content,
				icon,
				level: lvlEl,
				xpBar,
				xpText,
				cost: costEl,
				bar,
				progressText,
			});
		});
	}

	private updateResourcesDisplay() {
		this.resourceList.innerHTML = "";
		const resources = this.context.resources.getAllResources();
		for (let [id, data] of resources) {
			if (!data.isUnlocked || data.infinite) continue;
			const spec = Resource.getSpec(id);
			if (!spec) continue;
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
			row.addEventListener("mouseenter", () => {
				Tooltip.instance.show(row, { icon: spec.iconUrl, name: spec.name, description: spec.description });
			});
			row.addEventListener("mouseleave", () => Tooltip.instance.hide());
			this.resourceList.appendChild(row);
		}
	}

	private updateUpgrades() {
		this.upgradeGrid.innerHTML = "";
		const upgrades = this.context.blacksmith.getUpgrades();
		upgrades.forEach((upg) => {
			const card = document.createElement("div");
			card.className = "blacksmith-upgrade-card";
			if (upg.isPurchased) card.classList.add("purchased");

			const nameEl = document.createElement("div");
			nameEl.className = "blacksmith-upgrade-title";
			nameEl.textContent = upg.name;
			card.appendChild(nameEl);

			const costEl = document.createElement("div");
			costEl.className = "blacksmith-upgrade-cost";
			costEl.textContent = upg.cost.map((c) => `${c.quantity} ${Resource.getSpec(c.resource)?.name ?? c.resource}`).join(", ");
			card.appendChild(costEl);

			const canAfford = this.context.resources.canAfford(upg.cost);
			if (!canAfford) card.classList.add("disabled");

			card.addEventListener("mouseenter", () => {
				Tooltip.instance.show(card, {
					icon: upg.icon,
					name: upg.name,
					description: upg.description,
				});
			});
			card.addEventListener("mouseleave", () => Tooltip.instance.hide());

			card.addEventListener("click", () => {
				if (canAfford && !upg.isPurchased) {
					this.context.blacksmith.purchaseUpgrade(upg.id);
				}
			});
			this.upgradeGrid.appendChild(card);
		});
	}

	/**
	 * Updates the UI elements for each blacksmith slot on every tick.
	 *
	 * This method iterates through all blacksmith slots and updates their corresponding UI elements
	 * based on the current crafting state. It handles both the case where a resource is being crafted
	 * and the case where no resource is selected.
	 *
	 * @param dt - The delta time since the last tick, in seconds.
	 *
	 * For each slot:
	 * - If a resource is assigned:
	 *   - Updates the progress bar, button text, icon, and cost display.
	 *   - Shows the crafting progress and required resources.
	 *   - If resource data is available, updates the level and XP bars.
	 * - If no resource is assigned:
	 *   - Resets the UI elements to their default state.
	 */
	private handleTick(dt: number) {
		const slots = this.context.blacksmith.getSlots();
		slots.forEach((slot, idx) => {
			const el = this.slotEls[idx];
			if (!el) return;
			const spec = slot.resourceId ? Resource.getSpec(slot.resourceId) : null;
			const data = slot.resourceId ? this.context.resources.getResourceData(slot.resourceId) : undefined;
			if (spec) {
				el.bar.setMax(spec.craftTime);
				el.bar.setValue(spec.craftTime - slot.progress);
				el.selectBtn.textContent = spec.name;
				el.icon.src = spec.iconUrl;
                                el.cost.innerHTML = "";
                                spec.requires.forEach((r) => {
                                        if (!r.resource) return;
                                        const have = this.context.resources.getResourceQuantity(r.resource);
                                        const item = document.createElement("div");
                                        item.className = "bs-cost-item";
                                        const img = document.createElement("img");
                                        img.src = Resource.getSpec(r.resource)?.iconUrl ?? "";
                                        item.appendChild(img);
                                        const txt = document.createElement("span");
                                        txt.textContent = `${have}/${r.quantity}`;
                                        if (have < r.quantity) txt.classList.add("insufficient");
                                        item.appendChild(txt);
                                        el.cost.appendChild(item);
                                });
				el.progressText.textContent = `${Math.ceil(slot.progress)}s`;

				if (data) {
					const xpNeeded = data.level * 10;
					el.level.textContent = `Lv ${data.level}`;
					el.xpBar.setMax(xpNeeded);
					el.xpBar.setValue(data.xp);
					el.xpText.textContent = `XP ${data.xp}/${xpNeeded}`;
				}
			} else {
				el.bar.setMax(1);
				el.bar.setValue(0);
				el.selectBtn.textContent = "Choose";
				el.icon.src = "";
				el.level.textContent = "";
				el.xpBar.setMax(1);
				el.xpBar.setValue(0);
				el.xpText.textContent = "";
				el.cost.innerHTML = "";
				el.progressText.textContent = "";
			}
		});
	}
}
