import { bus } from "@/core/EventBus";
import { saveManager } from "@/core/SaveManager";
import { BigNumber } from "@/models/utils/BigNumber";

export class DebugMenu {
    private rootEl!: HTMLElement;
    constructor() {}

    build() {
        this.rootEl = document.getElementById("debug-menu")!;
        this.rootEl.innerHTML = "";
        this.addOptions();
    }

    addOptions() {
        const saveBtn = document.createElement("button");
        saveBtn.classList.add("button");
        saveBtn.textContent = "Save";
        this.rootEl.appendChild(saveBtn);
        saveBtn.addEventListener("click", () => saveManager.saveAll());

        const loadBtn = document.createElement("button");
        loadBtn.classList.add("button");
        loadBtn.textContent = "Load";
        this.rootEl.appendChild(loadBtn);
        loadBtn.addEventListener("click", () => saveManager.loadAll());

        const newGameBtn = document.createElement("button");
        newGameBtn.classList.add("button");
        newGameBtn.textContent = "New Game";
        this.rootEl.appendChild(newGameBtn);
        newGameBtn.addEventListener("click", () => saveManager.startNewGame());

        const addRenownBtn = document.createElement("button");
        addRenownBtn.classList.add("button");
        addRenownBtn.textContent = "Add Renown";
        this.rootEl.appendChild(addRenownBtn);
        addRenownBtn.addEventListener("click", () => bus.emit("renown:award", new BigNumber(10)));
    }
}
