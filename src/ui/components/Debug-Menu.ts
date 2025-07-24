import { debugManager, type DebugOptions, printLog } from "@/core/DebugManager";
import { bus } from "@/core/EventBus";
import { InventoryRegistry } from "@/features/inventory/InventoryRegistry";
import { GameContext } from "@/core/GameContext";
import { OfflineSession, OfflineReason } from "@/models/OfflineProgress";
import { BalanceDebug } from "@/balance/GameBalance";
import { Area } from "@/models/Area";
import { Monster } from "@/models/Monster";
import { ToastManager } from "./ToastManager";
import { MilestoneManager } from "@/models/MilestoneManager";

export class DebugMenu {
	private rootEl!: HTMLElement;
	private toggleBtn!: HTMLButtonElement;
	private optionsEl!: HTMLElement;
	private playerStatsEl!: HTMLElement;
	private enemyStatsEl!: HTMLElement;
	private areaInfoEl!: HTMLElement;
	constructor() {}

	build() {
		this.rootEl = document.getElementById("debug-menu")!;
		this.rootEl.innerHTML = "";
		this.rootEl.classList.add("debug-panel");
		this.rootEl.style.display = "flex";

		this.optionsEl = document.createElement("div");
		this.optionsEl.className = "debug-column options";
		this.playerStatsEl = document.createElement("div");
		this.playerStatsEl.className = "debug-column player-stats";
		this.enemyStatsEl = document.createElement("div");
		this.enemyStatsEl.className = "debug-column enemy-stats";
		this.areaInfoEl = document.createElement("div");
		this.areaInfoEl.className = "debug-column area-info";

		this.rootEl.appendChild(this.optionsEl);
		this.rootEl.appendChild(this.playerStatsEl);
		this.rootEl.appendChild(this.enemyStatsEl);
		this.rootEl.appendChild(this.areaInfoEl);

		bus.on("debug:statsUpdate", (payload) => {
			if (payload.isPlayer) {
				this.playerStatsEl.textContent = payload.data;
			} else {
				this.enemyStatsEl.textContent = payload.data;
			}
		});

		bus.on("hunt:areaChanged", (area) => this.updateAreaInfo(area));

		this.buildToggleButton();
		this.buildControls();
		this.addActions();
		this.updateAreaInfo();
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
		this.rootEl.style.display = visible ? "flex" : "none";
	}

	private buildControls() {
		const options: { key: keyof DebugOptions; label: string; type: "bool" | "num"; step?: number }[] = [
			{ key: "enemy_canAttack", label: "Enemy Can Attack", type: "bool" },
			{ key: "enemy_canTakeDamage", label: "Enemy Takes Damage", type: "bool" },
			{ key: "enemy_canDie", label: "Enemy Can Die", type: "bool" },
			{ key: "player_canDie", label: "Player Can Die", type: "bool" },
			{ key: "player_canTakeDamage", label: "Player Can Take Damage", type: "bool" },
			{ key: "hunt_allAreasOpen", label: "All Areas Open", type: "bool" },
			{ key: "hunt_searchSpeed", label: "Search Speed", type: "num", step: 0.1 },
			{ key: "building_infinitePoints", label: "Inf Build Points", type: "bool" },
			{ key: "upgrades_unlockAll", label: "Unlock All Upgrades", type: "bool" },
			{ key: "upgrades_instantBuild", label: "Instant Build", type: "bool" },
			{ key: "reseach_unlockAll", label: "Unlock All Research", type: "bool" },
			{ key: "research_instantResearch", label: "Instant Research", type: "bool" },
			{ key: "showcombatstats", label: "Show Combat Stats", type: "bool" },
			{ key: "rewards_alwaysDropAllLoot", label: "Always Drop Recruit", type: "bool" },
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
			console.log("Debug option changed:", key, input.checked);
		});
		wrap.appendChild(input);
		wrap.appendChild(document.createTextNode(label));
		this.optionsEl.appendChild(wrap);
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
		this.optionsEl.appendChild(wrap);
	}

	private addInputTrigger(label: string, func: (id: string) => void) {
		const wrap = document.createElement("label");
		wrap.classList.add("debug-option");
		const input = document.createElement("input");
		input.type = "text";
		input.placeholder = label;
		const btn = document.createElement("button");
		btn.textContent = "Trigger";
		btn.addEventListener("click", () => {
			const id = input.value.trim();
			if (id) {
				func(id);
				input.value = "";
			}
		});
		wrap.appendChild(input);
		wrap.appendChild(btn);
		this.optionsEl.appendChild(wrap);
	}

	private addActions() {
		const context = GameContext.getInstance();
		this.addInputTrigger("Trigger Milestone", (id) => MilestoneManager.instance.triggerMilestone(id));
		this.addInputTrigger("Give Equipment", (id) => context.inventory.addLootById(id));
		this.addButton("Save", () => context.saves.saveAll());
		this.addButton("Load", () => window.location.reload()); //saveManager.loadAll());
		this.addButton("New Game", () => context.saves.startNewGame());
		this.addButton("New Debug Game", () => {
			//context.saves.startNewGame();
			MilestoneManager.instance.debugUnlockAll();
		});
		this.addButton("Add Renown", () => bus.emit("renown:award", 100000));
		this.addButton("Kill Enemy", () => bus.emit("debug:killEnemy"));
		this.addButton("Test Enemy", () => context.hunt.debugForceEnemy("test_enemy", 6));
		this.addButton("Unlock Boss", () => context.stats.debugUnlockBoss(context.hunt.getActiveAreaID()));
		this.addButton("Set Boss Killed", () => bus.emit("hunt:bossKill", { areaId: context.hunt.getActiveAreaID() }));
		this.addButton("Test Loot", () => {
			const specs = InventoryRegistry.getSpecsByTags(["t1"]);
			const spec = specs[Math.floor(Math.random() * specs.length)];
			context.inventory.addLootById(spec.id, 20);
		});
		this.addButton("Clear Loot", () => context.inventory.clearSlots());
		this.addButton("Print Stats", () => context.character.statsEngine.printStats());
		this.addButton("Fake Offline Session", () => this.testOfflineSession());
		this.addButton("Set Max Energy", () => context.player.debugEnergy());
		this.addButton("Char Level Up", () => context.character.gainXp(context.character.nextXpThreshold));
		// In Debug-Menu.ts
		this.addButton("Full Balance Check", () => BalanceDebug.runFullBalanceCheck());
		this.addButton("Test Prestige Scaling", () => BalanceDebug.validatePrestigeBalance());
		this.addButton("Progression Curves", () => BalanceDebug.logProgressionCurves());
		this.addButton("Unlock all buildings", () => context.settlement.unlockAllBuildings());
		this.addButton("Unlock all resources", () => context.resources.debugUnlockAllResources());
		this.addButton("Level Up Player Character", () => context.character.gainXp(-1));
		this.addButton("Level Up Resource", () => context.blacksmith.debugLevelUpResource());
		this.addButton("Test Toast", () => ToastManager.instance.enqueue("Test", "Test"));
		this.addButton("Grant Class Points", () => context.classes.gainPoints(100));
		this.addButton("Add Blacksmith Resources", () => context.blacksmith.debugAddResources());
		this.addButton("Add Staff", () => context.recruits.createRecruit("blacksmith"));
		//  Player.getInstance().inventory.addItemToInventory);
		//this.addButton("Test Loot", () => console.log(InventoryRegistry.getSpecsByTags(["t1"])));
	}

	private testOfflineSession() {
		if (debugManager.debugEnabled) {
			const fakeSession: OfflineSession = {
				startTime: Date.now() - 8 * 60 * 60 * 1000, // 8 hours ago
				endTime: Date.now(),
				duration: 8 * 60 * 60 * 1000,
				reason: OfflineReason.Startup,
			};
			GameContext.getInstance().offlineManager.processOfflineSession(fakeSession);
		}
	}

	private addButton(name: string, onClick: () => void) {
		const btn = document.createElement("button");
		btn.classList.add("button");
		btn.textContent = name;
		this.optionsEl.appendChild(btn);
		btn.addEventListener("click", onClick);
	}

	private updateAreaInfo(area?: Area) {
		const context = GameContext.getInstance();
		const currentArea = area || context.hunt.getActiveArea();

		if (!currentArea) {
			this.areaInfoEl.innerHTML = "<h3>Area Info</h3><p>No area selected</p>";
			return;
		}

		const areaStats = context.stats.getAreaStats(currentArea.id);

		// Get enemy pool information
		const enemyPool = currentArea.spawns.map((spawn) => {
			const monsterSpec = Monster.getSpec(spawn.monsterId);
			return {
				name: monsterSpec?.displayName || spawn.monsterId,
				weight: spawn.weight,
				dropTags: spawn.drops.tags,
				dropChance: spawn.drops.baseDropChance,
			};
		});

		// Get boss information
		const bossSpec = Monster.getSpec(currentArea.boss.monsterId);
		const bossInfo = {
			name: bossSpec?.displayName || currentArea.boss.monsterId,
			weight: currentArea.boss.weight,
			dropTags: currentArea.boss.drops.tags,
			dropChance: currentArea.boss.drops.baseDropChance,
		};

		// Get loot pool information
		const lootTags = [...new Set(enemyPool.flatMap((enemy) => enemy.dropTags))];
		const lootPool = lootTags.flatMap((tag) =>
			InventoryRegistry.getSpecsByTags([tag]).map((spec) => ({
				name: spec.name || spec.id,
				id: spec.id,
				tags: spec.tags,
			}))
		);

		// Get progression requirements
		const requirements = currentArea.requires;

		// Get progression unlocks (what this area unlocks) - simplified approach
		const unlocks: string[] = [];
		// Note: We could implement a proper progression system lookup here if needed

		this.areaInfoEl.innerHTML = `
			<h3>Area Info: ${currentArea.displayName}</h3>
			<div class="area-info-section">
				<h4>Basic Info</h4>
				<p><strong>ID:</strong> ${currentArea.id}</p>
				<p><strong>Tier:</strong> ${currentArea.tier}</p>
				<p><strong>XP per Kill:</strong> ${currentArea.getXpPerKill(false)}</p>
				<p><strong>XP per Boss:</strong> ${currentArea.getXpPerKill(true)}</p>
			</div>

			<div class="area-info-section">
				<h4>Area Stats</h4>
				<p><strong>Boss Unlocked:</strong> ${areaStats.bossUnlockedThisRun ? "Yes" : "No"}</p>
				<p><strong>Boss Killed This Run:</strong> ${areaStats.bossKilledThisRun ? "Yes" : "No"}</p>
				<p><strong>Total Boss Kills:</strong> ${areaStats.bossKillsTotal}</p>
				<p><strong>Total Kills:</strong> ${areaStats.killsTotal}</p>
				<p><strong>Kills This Run:</strong> ${areaStats.killsThisRun}</p>
			</div>

			<div class="area-info-section">
				<h4>Progression</h4>
				<p><strong>Requirements:</strong> ${requirements.length > 0 ? requirements.join(", ") : "None"}</p>
				<p><strong>Unlocks:</strong> ${unlocks.length > 0 ? unlocks.join(", ") : "None"}</p>
			</div>

			<div class="area-info-section">
				<h4>Enemy Pool (${enemyPool.length} enemies)</h4>
				${enemyPool
					.map(
						(enemy) => `
					<div class="enemy-entry">
						<strong>${enemy.name}</strong> (Weight: ${enemy.weight})<br>
						<small>Drop chance: ${(enemy.dropChance * 100).toFixed(3)}% | Tags: ${enemy.dropTags.join(", ")}</small>
					</div>
				`
					)
					.join("")}
			</div>

			<div class="area-info-section">
				<h4>Boss</h4>
				<div class="enemy-entry">
					<strong>${bossInfo.name}</strong><br>
					<small>Drop chance: ${(bossInfo.dropChance * 100).toFixed(1)}% | Tags: ${bossInfo.dropTags.join(", ")}</small>
				</div>
			</div>

			<div class="area-info-section">
				<h4>Loot Pool (${lootPool.length} unique items)</h4>
				<div class="loot-tags">
					<strong>Available Tags:</strong> ${lootTags.join(", ")}
				</div>
				<div class="loot-items">
					${lootPool
						.slice(0, 10)
						.map(
							(item) => `
						<div class="loot-entry">
							<small>${item.name} (${item.id})</small>
						</div>
					`
						)
						.join("")}
					${lootPool.length > 10 ? `<small>... and ${lootPool.length - 10} more items</small>` : ""}
				</div>
			</div>
		`;
	}
}
