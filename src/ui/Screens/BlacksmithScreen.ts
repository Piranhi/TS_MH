import { bus } from "@/core/EventBus";
import { BaseScreen } from "./BaseScreen";
import Markup from "./blacksmith.html?raw";
import { bindEvent } from "@/shared/utils/busUtils";
import { Resource } from "@/features/inventory/Resource";
import { ProgressBar } from "../components/ProgressBar";
import { Tooltip } from "../components/Tooltip";
import { BlacksmithUpgrade } from "@/features/settlement/BlacksmithUpgrade";

interface SlotElements {
        container: HTMLElement;
        select: HTMLSelectElement;
        bar: ProgressBar;
        label: HTMLElement;
        cost: HTMLElement;
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

	private buildSlots() {
		this.slotGrid.innerHTML = "";
		this.slotEls = [];
		const slots = this.context.blacksmith.getSlots();
                const resources = this.context.resources.getAllResources();
                const available = Array.from(resources.entries())
                        .filter(([id, d]) => id !== "raw_ore" && d.isUnlocked && !d.infinite)
                        .map(([id]) => id);
                slots.forEach((slot, idx) => {
                        const el = document.createElement("div");
                        el.className = "blacksmith-slot";
                        const sel = document.createElement("select");
                        const emptyOpt = document.createElement("option");
                        emptyOpt.value = "";
                        emptyOpt.textContent = "-- Select --";
                        sel.appendChild(emptyOpt);
                        available.forEach((id) => {
                                const spec = Resource.getSpec(id);
                                if (!spec) return;
                                const o = document.createElement("option");
                                o.value = id;
                                const costs = spec.requires
                                        .filter((r) => r.resource)
                                        .map((r) => {
                                                const have = this.context.resources.getResourceQuantity(r.resource);
                                                return `${r.quantity}/${have}`;
                                        })
                                        .join(" ");
                                o.textContent = costs;
                                sel.appendChild(o);
                        });
                        sel.value = slot.resourceId ?? "";
                        sel.addEventListener("change", () => {
                                this.context.blacksmith.setSlotResource(idx, sel.value || null);
                        });
                        el.appendChild(sel);
                        const label = document.createElement("div");
                        label.textContent = "";
                        el.appendChild(label);
                        const costEl = document.createElement("div");
                        costEl.className = "blacksmith-slot-cost";
                        el.appendChild(costEl);
                        const barContainer = document.createElement("div");
                        el.appendChild(barContainer);
                        const progressText = document.createElement("div");
                        progressText.className = "progress-text";
                        barContainer.appendChild(progressText);
                        const bar = new ProgressBar({ container: barContainer, maxValue: 1, initialValue: 0 });
                        this.slotGrid.appendChild(el);
                        this.slotEls.push({ container: el, select: sel, bar, label, cost: costEl, progressText });
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
                        costEl.textContent = upg.cost
                                .map((c) => `${c.quantity} ${Resource.getSpec(c.resource)?.name ?? c.resource}`)
                                .join(", ");
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

        private handleTick(dt: number) {
                const slots = this.context.blacksmith.getSlots();
                slots.forEach((slot, idx) => {
                        const el = this.slotEls[idx];
                        if (!el) return;
                        const spec = slot.resourceId ? Resource.getSpec(slot.resourceId) : null;
                        if (spec) {
                                el.bar.setMax(spec.craftTime);
                                el.bar.setValue(spec.craftTime - slot.progress);
                                el.label.textContent = spec.name;
                                const costStr = spec.requires
                                        .filter((r) => r.resource)
                                        .map((r) => {
                                                const have = this.context.resources.getResourceQuantity(r.resource);
                                                return `${r.quantity}/${have}`;
                                        })
                                        .join(" ");
                                el.cost.textContent = costStr;
                                el.progressText.textContent = `${Math.ceil(slot.progress)}s`;
                        } else {
                                el.bar.setMax(1);
                                el.bar.setValue(0);
                                el.label.textContent = "";
                                el.cost.textContent = "";
                                el.progressText.textContent = "";
                        }
                });
        }
}
