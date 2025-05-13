import { saveManager } from "@/core/SaveManager";

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
	}
}
