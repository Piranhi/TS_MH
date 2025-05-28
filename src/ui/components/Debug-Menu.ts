import { debugManager, printLog } from "@/core/DebugManager";
import { bus } from "@/core/EventBus";
import { InventoryRegistry } from "@/features/inventory/InventoryRegistry";
import { PlayerCharacter } from "@/models/PlayerCharacter";
import { BigNumber } from "@/models/utils/BigNumber";
import { GameContext } from "@/core/GameContext";
import { OfflineSession } from "@/models/OfflineProgress";
import { BalanceDebug } from "@/balance/GameBalance";

export class DebugMenu {
	private rootEl!: HTMLElement;
	constructor() {}

	build() {
		this.rootEl = document.getElementById("debug-menu")!;
		this.rootEl.innerHTML = "";
		this.addOptions();
	}

	addOptions() {
		const context = GameContext.getInstance();
		this.addButton("Save", () => context.saves.saveAll());
		this.addButton("Load", () => window.location.reload()); //saveManager.loadAll());
		this.addButton("New Game", () => context.saves.startNewGame());
		this.addButton("Add Renown", () => bus.emit("renown:award", new BigNumber(100000)));
		//this.addButton("Kill Player", () => Player.getInstance().character?.takeDamage(new BigNumber(1000000)));
		this.addButton("Kill Enemy", () => bus.emit("debug:killEnemy"));
		this.addButton("Test Loot", () => {
			const specs = InventoryRegistry.getSpecsByTags(["t1"]);
			console.log(specs);
			const spec = specs[Math.floor(Math.random() * specs.length)];
			context.inventory.addLootById(spec.id, 1);
		});
		this.addButton("Clear Loot", () => context.inventory.clearSlots());
		this.addButton("Print Stats", () => {
			context.character.statsEngine.printStats();
		});

		this.addButton("Test Attack", () => {
			const array: string[] = [];
			for (let i = 0; i < 50; i++) {
				array.push(this.debugAttack(context.character).toString());
			}
			console.log(array);
		});
		this.addButton("Fake Offline Session", () => this.testOfflineSession());
		this.addButton("Set Max Stamina", () => context.player.debugStamina());
		this.addButton("Char Level Up", () => context.character.gainXp(context.character.nextXpThreshold));
		// In Debug-Menu.ts
		this.addButton("Full Balance Check", () => BalanceDebug.runFullBalanceCheck());
		this.addButton("Test Prestige Scaling", () => BalanceDebug.validatePrestigeBalance());
		this.addButton("Progression Curves", () => BalanceDebug.logProgressionCurves());
		//  Player.getInstance().inventory.addItemToInventory);
		//this.addButton("Test Loot", () => console.log(InventoryRegistry.getSpecsByTags(["t1"])));
	}

	private testOfflineSession() {
		if (debugManager.debugEnabled) {
			const fakeSession: OfflineSession = {
				startTime: Date.now() - 8 * 60 * 60 * 1000, // 8 hours ago
				endTime: Date.now(),
				duration: 8 * 60 * 60 * 1000,
				reason: "startup",
			};
			GameContext.getInstance().offlineManager.processOfflineSession(fakeSession);
		}
	}

	private debugAttack(pc: PlayerCharacter) {
		//const attack = new BigNumber(pc.stats.get("attack"));
		const attack = new BigNumber(1000);
		const powerMultiplier = 1 + pc.stats.get("power") / 10;
		const critChance = pc.stats.get("critChance") / 100;
		const critDamage = pc.stats.get("critDamage") / 100;
		const rolledCrit = Math.random() < critChance;
		const critMultiplier = rolledCrit ? 1 + critDamage : 1;
		const variance = 0.9 + Math.random() * 0.2;

		// for a damage effect: attack × power × crit × variance × effect.scale
		const totalMultiplier = powerMultiplier * critMultiplier * variance;
		const final = attack.multiply(totalMultiplier);
		return final;
		printLog(`Attack ${rolledCrit ? "[CRIT]" : ""} : ${final} `, 1, "Debug-Menu.ts");
	}

	private addButton(name: string, onClick: () => void) {
		const btn = document.createElement("button");
		btn.classList.add("button");
		btn.textContent = name;
		this.rootEl.appendChild(btn);
		btn.addEventListener("click", onClick);
	}
}
