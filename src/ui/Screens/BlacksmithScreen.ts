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
			.filter(([_, d]) => d.isUnlocked && !d.infinite)
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
				o.textContent = spec.name;
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
			const barContainer = document.createElement("div");
			el.appendChild(barContainer);
			const bar = new ProgressBar({ container: barContainer, maxValue: 1, initialValue: 0 });
			this.slotGrid.appendChild(el);
			this.slotEls.push({ container: el, select: sel, bar, label });
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
			card.textContent = upg.name;
			card.addEventListener("click", () => {
				this.context.blacksmith.purchaseUpgrade(upg.id);
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
			} else {
				el.bar.setMax(1);
				el.bar.setValue(0);
				el.label.textContent = "";
			}
		});
	}
}
