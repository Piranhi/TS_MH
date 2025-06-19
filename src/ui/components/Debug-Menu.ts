import { debugManager, type DebugOptions, printLog } from "@/core/DebugManager";
import { bus } from "@/core/EventBus";
import { InventoryRegistry } from "@/features/inventory/InventoryRegistry";
import { PlayerCharacter } from "@/models/PlayerCharacter";
import { BigNumber } from "@/models/utils/BigNumber";
import { GameContext } from "@/core/GameContext";
import { OfflineSession } from "@/models/OfflineProgress";
import { BalanceDebug } from "@/balance/GameBalance";

export class DebugMenu {
	private rootEl!: HTMLElement;
	private toggleBtn!: HTMLButtonElement;
	constructor() {}

	build() {
		this.rootEl = document.getElementById("debug-menu")!;
		this.rootEl.innerHTML = "";
		this.rootEl.classList.add("debug-panel");
		this.rootEl.style.display = "none";

		this.buildToggleButton();
		this.buildControls();
		this.addActions();
	}

	private buildToggleButton() {
		this.toggleBtn = document.createElement("button");
		this.toggleBtn.id = "debug-toggle";
		this.toggleBtn.textContent = "\uD83D\uDC1E"; // bug emoji
		document.body.appendChild(this.toggleBtn);
		this.toggleBtn.addEventListener("click", () => this.toggle());
		document.addEventListener("keydown", (e) => {
			if (e.key === "F1") {
				e.preventDefault();
				this.toggle();
			}
		});
	}

	private toggle() {
		const visible = this.rootEl.style.display === "none";
		this.rootEl.style.display = visible ? "block" : "none";
	}

	private buildControls() {
		const options: { key: keyof DebugOptions; label: string; type: "bool" | "num"; step?: number }[] = [
			{ key: "enemy_canAttack", label: "Enemy Can Attack", type: "bool" },
			{ key: "enemy_canTakeDamage", label: "Enemy Takes Damage", type: "bool" },
			{ key: "enemy_canDie", label: "Enemy Can Die", type: "bool" },
			{ key: "hunt_allAreasOpen", label: "All Areas Open", type: "bool" },
			{ key: "hunt_searchSpeed", label: "Search Speed", type: "num", step: 0.1 },
		];

		options.forEach((opt) => {
			if (opt.type === "bool") {
				this.addToggle(opt.label, opt.key);
			} else {
				this.addNumber(opt.label, opt.key, opt.step ?? 1);
			}
		});
	}

	private addToggle(label: string, key: keyof DebugOptions) {
		const wrap = document.createElement("label");
		wrap.classList.add("debug-option");
		const input = document.createElement("input");
		input.type = "checkbox";
		input.checked = !!debugManager.get(key);
		input.addEventListener("change", () => {
			debugManager.set(key, input.checked as any);
		});
		wrap.appendChild(input);
		wrap.appendChild(document.createTextNode(label));
		this.rootEl.appendChild(wrap);
	}

	private addNumber(label: string, key: keyof DebugOptions, step: number) {
		const wrap = document.createElement("label");
		wrap.classList.add("debug-option");
		const span = document.createElement("span");
		span.textContent = label + ": ";
		const input = document.createElement("input");
		input.type = "number";
		input.step = String(step);
		input.value = String(debugManager.get(key));
		input.addEventListener("change", () => {
			debugManager.set(key, Number(input.value) as any);
		});
		wrap.appendChild(span);
		wrap.appendChild(input);
		this.rootEl.appendChild(wrap);
	}

	private addActions() {
		const context = GameContext.getInstance();
		this.addButton("Save", () => context.saves.saveAll());
		this.addButton("Load", () => window.location.reload()); //saveManager.loadAll());
		this.addButton("New Game", () => context.saves.startNewGame());
		this.addButton("Add Renown", () => bus.emit("renown:award", new BigNumber(100000)));
		//this.addButton("Kill Player", () => Player.getInstance().character?.takeDamage(new BigNumber(1000000)));
		this.addButton("Kill Enemy", () => bus.emit("debug:killEnemy"));
		this.addButton("Clear Area", () => {
			bus.emit("hunt:bossKill", { areaId: context.hunt.getActiveAreaID() });
		});
		this.addButton("Test Loot", () => {
			const specs = InventoryRegistry.getSpecsByTags(["t1"]);
			const spec = specs[Math.floor(Math.random() * specs.length)];
			context.inventory.addLootById(spec.id, 1);
		});
                this.addButton("Clear Loot", () => context.inventory.clearSlots());
                this.addButton("Print Stats", () => {
                        context.character.statsEngine.printStats();
                });
                this.addButton("Print Modifiers", () => {
                        context.modifiers.printDebug();
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
		this.addButton("Unlock all buildings", () => context.settlement.unlockAllBuildings());
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
