import { bus } from "@/core/EventBus";
import { saveManager } from "@/core/SaveManager";
import { InventoryRegistry } from "@/features/inventory/InventoryRegistry";
import { Player } from "@/models/player";
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
		this.addButton("Save", () => saveManager.saveAll());
		this.addButton("Load", () => window.location.reload()); //saveManager.loadAll());
		this.addButton("New Game", () => saveManager.startNewGame());
		this.addButton("Add Renown", () => bus.emit("renown:award", new BigNumber(100000)));
		//this.addButton("Kill Player", () => Player.getInstance().character?.takeDamage(new BigNumber(1000000)));
		this.addButton("Kill Enemy", () => bus.emit("debug:killEnemy"));
		this.addButton("Test Loot", () => {
			const specs = InventoryRegistry.getSpecsByTags(["t1"]);
			console.log(specs);
			const spec = specs[Math.floor(Math.random() * specs.length)];
			Player.getInstance().inventory.addLootById(spec.id, 1);
		});
		this.addButton("Clear Loot", () => Player.getInstance().inventory.clearSlots());
		this.addButton("Print Stats", () => Player.getInstance().getPlayerCharacter().statsEngine.printStats());

		//  Player.getInstance().inventory.addItemToInventory);
		//this.addButton("Test Loot", () => console.log(InventoryRegistry.getSpecsByTags(["t1"])));
	}

	private addButton(name: string, onClick: () => void) {
		const btn = document.createElement("button");
		btn.classList.add("button");
		btn.textContent = name;
		this.rootEl.appendChild(btn);
		btn.addEventListener("click", onClick);
	}
}
