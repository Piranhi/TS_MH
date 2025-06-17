import { UIBase } from "./UIBase";
import { UpgradeSelectionComponent, UpgradeSelectionData } from "./UpgradeSelectionComponent";

export interface UpgradeSelectionContainerOptions {
    container: HTMLElement;
    upgrades: UpgradeSelectionData[];
    onUpgradeClick?: (id: string) => void;
}

export class UpgradeSelectionContainer extends UIBase {
    private filterPurchased!: HTMLInputElement;
    private filterAffordable!: HTMLInputElement;
    private gridEl!: HTMLElement;
    private components = new Map<string, UpgradeSelectionComponent>();
    private upgrades: UpgradeSelectionData[] = [];
    private onUpgradeClick?: (id: string) => void;

    constructor(options: UpgradeSelectionContainerOptions) {
        super();
        this.element = options.container;
        this.element.classList.add("upgrade-selection-container");
        this.onUpgradeClick = options.onUpgradeClick;
        this.buildFilters();
        this.gridEl = document.createElement("div");
        this.gridEl.className = "upgrade-grid";
        this.element.appendChild(this.gridEl);
        this.setUpgrades(options.upgrades);
    }

    private buildFilters() {
        const filterRow = document.createElement("div");
        filterRow.className = "upgrade-filters";

        this.filterPurchased = document.createElement("input");
        this.filterPurchased.type = "checkbox";
        this.filterPurchased.checked = true;
        const purchasedLabel = document.createElement("label");
        purchasedLabel.appendChild(this.filterPurchased);
        purchasedLabel.appendChild(document.createTextNode(" Show purchased"));
        filterRow.appendChild(purchasedLabel);

        this.filterAffordable = document.createElement("input");
        this.filterAffordable.type = "checkbox";
        this.filterAffordable.checked = true;
        const affordLabel = document.createElement("label");
        affordLabel.appendChild(this.filterAffordable);
        affordLabel.appendChild(document.createTextNode(" Show unaffordable"));
        filterRow.appendChild(affordLabel);

        this.element.appendChild(filterRow);

        this.bindDomEvent(this.filterPurchased, "change", () => this.applyFilters());
        this.bindDomEvent(this.filterAffordable, "change", () => this.applyFilters());
    }

    public setUpgrades(upgrades: UpgradeSelectionData[]) {
        this.upgrades = upgrades;
        this.components.forEach((c) => c.destroy());
        this.components.clear();
        this.gridEl.innerHTML = "";
        upgrades.forEach((u) => {
            const comp = new UpgradeSelectionComponent({
                parent: this.gridEl,
                data: u,
                onClick: this.onUpgradeClick,
            });
            this.components.set(u.id, comp);
        });
        this.applyFilters();
    }

    private applyFilters() {
        const showPurchased = this.filterPurchased.checked;
        const showUnaffordable = this.filterAffordable.checked;
        this.components.forEach((comp) => {
            const data = comp.getData();
            let visible = true;
            if (!showPurchased && data.purchased) visible = false;
            if (!showUnaffordable && data.canAfford === false) visible = false;
            comp.setVisibleComponent(visible);
        });
    }
}
