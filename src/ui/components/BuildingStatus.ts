import { Building } from "@/features/settlement/Building";
import { UIBase } from "./UIBase";
import { bus } from "@/core/EventBus";

export class BuildingStatus extends UIBase {
    private levelEl!: HTMLElement;
    private allocatedEl!: HTMLElement;
    private requiredEl!: HTMLElement;
    constructor(private container: HTMLElement, private building: Building) {
        super();
        const root = document.createElement("div");
        root.classList.add("building-status");
        this.element = root;

        const nameEl = document.createElement("span");
        nameEl.textContent = building.displayName;
        nameEl.classList.add("bs-name");

        this.levelEl = document.createElement("span");
        this.allocatedEl = document.createElement("span");
        this.requiredEl = document.createElement("span");
        root.append(nameEl, this.levelEl, this.allocatedEl, this.requiredEl);
        this.container.appendChild(root);

        this.update();
        bus.on("settlement:changed", () => this.update());
    }

    private update() {
        const snap = this.building.snapshot;
        this.levelEl.textContent = `Lv ${snap.level}`;
        this.allocatedEl.textContent = `Allocated: ${snap.pointsAllocated}`;
        this.requiredEl.textContent = `Next: ${snap.nextUnlock}`;
    }
}
