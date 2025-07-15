import { BaseCharacter, PowerLevel } from "@/models/BaseCharacter";
import { EnemyCharacter } from "@/models/EnemyCharacter";
import { PlayerCharacter } from "@/models/PlayerCharacter";
import { debugManager } from "@/core/DebugManager";
import { STAT_KEYS } from "@/models/Stats";
import { UIBase } from "./UIBase";
import { Tooltip } from "./Tooltip";
import { ProgressBar } from "./ProgressBar";
import { formatNumberShort, prettify } from "@/shared/utils/stringUtils";
import { bus } from "@/core/EventBus";
import { bindEvent } from "@/shared/utils/busUtils";
import { STATUSES } from "@/features/hunt/satus-definition";

// Type to track transition cleanup
interface TransitionCleanup {
	element: HTMLElement;
	timeoutId: number;
}

type HolderStatus = "active" | "inactive";

export class CharacterDisplay extends UIBase {
	private character!: BaseCharacter;
	private nameEl!: HTMLElement;
	private statGridEl!: HTMLElement;
	private hpBar!: ProgressBar;
	private hpValueEl!: HTMLElement;
	private hpChangeEl!: HTMLElement;
	private staminaBar!: ProgressBar;
	private staminaValueEl!: HTMLElement;
	private avatarImg!: HTMLImageElement;
	private abilitiesListEl!: HTMLUListElement;
	private abilitiesListMap = new Map<string, HTMLElement>();
	private affinityRowEl?: HTMLElement;
	private statusRowEl!: HTMLElement;
	private manaBar!: ProgressBar;
	private manaValueEl!: HTMLElement;
	private debugStatsEl?: HTMLElement;

	// Track active transitions for cleanup
	private activeTransitions = new Map<string, TransitionCleanup>();

	constructor(public readonly isPlayer: boolean, element: HTMLElement) {
		super();
		this.element = element;
		this.createDisplay();
		bindEvent(this.eventBindings, "char:hpChanged", (payload) => {
			if (!this.character) return;
			if (payload.char !== this.character) return;
			this.showHpChange(payload.amount, payload.isCrit ?? false);
		});
	}

	receiveCharacter(char: BaseCharacter): void {
		this.character = char;
		this.setup();
	}

	private createDisplay() {
		// CACHE ELEMENTS
		this.nameEl = this.$(".char-name");
		//this.statGridEl = this.$(".stat-grid");
		this.buildHealthStack();

		this.affinityRowEl = this.element.querySelector<HTMLElement>(".affinity-row") || undefined;
		this.statusRowEl = this.$(".status-effects-row");

		this.avatarImg = this.byId("char-portrait") as HTMLImageElement;
		this.element.classList.add(this.isPlayer ? "player" : "enemy");
		this.abilitiesListEl = this.$(".ability-list") as HTMLUListElement;

		if (debugManager.get("showcombatstats")) {
			this.debugStatsEl = document.createElement("pre");
			this.debugStatsEl.className = "debug-stats";
			// Moved to DebugMenu; element kept for compatibility but not appended here
		}
	}

	private buildHealthStack() {
		this.hpValueEl = this.byId("health-value");
		this.manaValueEl = this.byId("mana-value");
		this.staminaValueEl = this.byId("stamina-value");
		this.hpChangeEl = this.byId("hp-change");
		this.hpChangeEl.addEventListener("animationend", () => {
			this.hpChangeEl.classList.remove("show");
		});

		this.staminaBar = new ProgressBar({
			container: this.byId("stamina-bar"),
			label: "ST",
			showLabel: false,
			initialValue: 0,
			maxValue: 1,
			color: "blue",
			smooth: true,
		});
		this.hpBar = new ProgressBar({
			container: this.byId("health-bar"),
			label: "HP",
			showLabel: false,
			initialValue: 0,
			maxValue: 1,
			color: "green",
			smooth: true, //this.isPlayer ? "green" : "red",
		});
		this.manaBar = new ProgressBar({
			container: this.byId("mana-bar"),
			label: "MP",
			showLabel: false,
			initialValue: 0,
			maxValue: 1,
			color: "blue",
			smooth: true,
		});
	}

	setup() {
		const snapshot = this.character.snapshot();
		const { abilities, imgUrl } = snapshot;

		this.avatarImg.src = imgUrl;
		this.abilitiesListMap.clear();
		this.abilitiesListEl.innerHTML = "";

		abilities.forEach((ability, idx) => {
			const li = document.createElement("li");
			li.className = "ability";
			li.dataset.abilityId = ability.id;
			li.setAttribute("draggable", "true");

			// Create the fill element that will show progress
			const fill = document.createElement("span");
			fill.className = "ability-fill ability-fill--smooth"; // Add smooth class

			const handle = document.createElement("span");
			handle.className = "drag-handle";
			handle.innerHTML = "&#9776;";

			const order = document.createElement("span");
			order.className = "ability-order";
			order.textContent = String(idx + 1);

			const iconImg = document.createElement("span");
			iconImg.className = "ability-icon";
			//iconImg.className = "icon";
			iconImg.style.backgroundImage = `url(${ability.spec.iconUrl})`;
			iconImg.style.backgroundSize = "cover";
			iconImg.style.backgroundPosition = "center";
			iconImg.style.backgroundRepeat = "no-repeat";

			const name = document.createElement("span");
			name.className = "ability-name basic-very-small";
			name.textContent = ability.name;

			// Create ability bars
			// Player abilities have a toggle, order, and draggable handle
			// Enemy abilities have a fill and icon
			if (this.isPlayer) {
				const toggle = document.createElement("input");
				toggle.type = "checkbox";
				toggle.checked = ability.enabled;
				toggle.className = "ability-toggle";
				toggle.addEventListener("change", () => {
					ability.enabled = toggle.checked;
				});

				li.addEventListener("dragstart", (e) => {
					e.dataTransfer!.setData("text/plain", ability.id);
				});

				li.addEventListener("dragover", (e) => e.preventDefault());
				li.addEventListener("drop", (e) => {
					e.preventDefault();
					const draggedId = e.dataTransfer!.getData("text/plain");
					const draggedEl = this.abilitiesListMap.get(draggedId);
					if (draggedEl && draggedEl !== li) {
						this.abilitiesListEl.insertBefore(draggedEl, li);
						this.updateAbilityOrder();
					}
				});

				li.addEventListener("mouseenter", () => {
					Tooltip.instance.show(li, {
						icon: ability.spec.iconUrl ?? "",
						type: prettify(ability.spec.element),
						list: [`Cost: ${ability.spec.staminaCost} stamina`, ability.description],
						name: ability.name,

						//description: `Cost: ${ability.spec.staminaCost} stamina`,
					});
				});
				li.addEventListener("mouseleave", () => Tooltip.instance.hide());

				li.appendChild(fill);
				li.appendChild(handle);
				li.appendChild(order);
				li.appendChild(iconImg);
				li.appendChild(name);
				li.appendChild(toggle);
			} else {
				li.appendChild(fill);
				li.appendChild(iconImg);
				li.appendChild(name);
			}

			this.abilitiesListEl.appendChild(li);
			this.abilitiesListMap.set(ability.id, li);
		});

		if (!this.isPlayer) {
			this.renderAffinities();
		}

		this.render();
	}

	async clearCharacter(): Promise<void> {
		this.character = null!;
		this.abilitiesListMap.clear();
		this.cleanupAllTransitions(); // Clean up any active transitions
	}

	// Used for rendering dead enemies - But setting health to 0
	private renderInactive() {
		this.element.classList.add("inactive");
		this.hpBar.setValue(0);
		this.abilitiesListMap.clear();
		this.abilitiesListEl.innerHTML = "";
		this.statusRowEl.innerHTML = "";
	}

	render(): void {
		if (!this.character) {
			this.renderInactive();
			return;
		}
		if (!this.character.alive) {
			this.element.classList.add("inactive");
		} else {
			this.element.classList.remove("inactive");
		}

		const snapshot = this.character.snapshot();
		const { name, hpCurrent, hpMax, staminaCurrent, staminaMax, abilities } = snapshot;
		this.nameEl.textContent = name;
		this.hpBar.setValue(hpCurrent);
		this.hpBar.setMax(hpMax);

		this.hpValueEl.textContent = `${formatNumberShort(hpCurrent, 0)} / ${formatNumberShort(hpMax, 0)} HP`;
		this.staminaBar.setValue(staminaCurrent);
		this.staminaBar.setMax(staminaMax);
		this.staminaValueEl.textContent = `${formatNumberShort(staminaCurrent, 0)} / ${formatNumberShort(staminaMax, 0)} ST`;

		abilities.forEach((ability, i) => {
			const bar = this.abilitiesListMap.get(ability.id);
			if (!bar) return;

			const toggle = bar.querySelector(".ability-toggle") as HTMLInputElement;
			if (toggle) toggle.checked = ability.enabled;
			const readinessRatio = ability.maxCooldown > 0 ? 1 - ability.currentCooldown / ability.maxCooldown : 1; // Default to ready if no cooldown

			const orderEl = bar.querySelector(".ability-order") as HTMLElement | null;
			if (orderEl) orderEl.textContent = String(i + 1);

			this.updateAbilityProgress(ability.id, bar, readinessRatio);
		});

		this.renderStatusEffects();
		this.createStatsGrid();
		const stats = this.getDebugStatsString();
		bus.emit("debug:statsUpdate", { isPlayer: this.isPlayer, data: stats });
		if (this.debugStatsEl) {
			this.debugStatsEl.textContent = stats;
		}
	}

	private updateAbilityProgress(abilityId: string, element: HTMLElement, ratio: number) {
		// Clean up any existing transition for this ability
		this.cleanupTransition(abilityId);

		// Set the new progress value
		element.style.setProperty("--hunt-cd", ratio.toString());

		// If we're in debug/speed mode, skip transitions to prevent memory buildup
		const isSpeedMode = this.checkIfSpeedMode();
		if (isSpeedMode) {
			const fillEl = element.querySelector(".ability-fill");
			if (fillEl) {
				fillEl.classList.remove("ability-fill--smooth");
			}
			return;
		}

		// Set up transition cleanup
		// CSS transition duration should match this timeout
		const transitionDuration = 300; // milliseconds
		const fillEl = element.querySelector(".ability-fill") as HTMLElement;

		if (fillEl) {
			const timeoutId = window.setTimeout(() => {
				this.activeTransitions.delete(abilityId);
			}, transitionDuration);

			this.activeTransitions.set(abilityId, {
				element: fillEl,
				timeoutId,
			});
		}
	}

	private checkIfSpeedMode(): boolean {
		// You can implement this based on your game's speed settings
		// For now, return false to always use smooth transitions
		// In your actual implementation, check if game speed > 1x
		return false; // TODO: Implement based on your game speed setting
	}

	private cleanupTransition(abilityId: string) {
		const transition = this.activeTransitions.get(abilityId);
		if (transition) {
			clearTimeout(transition.timeoutId);
			this.activeTransitions.delete(abilityId);
		}
	}

	private cleanupAllTransitions() {
		this.activeTransitions.forEach((transition) => {
			clearTimeout(transition.timeoutId);
		});
		this.activeTransitions.clear();
	}

	private updateAbilityOrder() {
		Array.from(this.abilitiesListEl.children).forEach((c, i) => {
			const id = (c as HTMLElement).dataset.abilityId!;
			const ability = this.character.getAbility(id);
			if (ability) ability.priority = i;
			const orderEl = (c as HTMLElement).querySelector(".ability-order") as HTMLElement | null;
			if (orderEl) orderEl.textContent = String(i + 1);
		});
	}

	private createStatsGrid() {
		const attackLabel = this.byId("attack-label");
		const defenceLabel = this.byId("defence-label");
		attackLabel.textContent = formatNumberShort(this.character.stats.get("attack") ?? 0);
		defenceLabel.textContent = formatNumberShort(this.character.stats.get("defence") ?? 0);
	}

	public getDebugStatsString(): string {
		let output = "";

		if (this.character instanceof PlayerCharacter) {
			const breakdown = this.character.statsEngine.getFullBreakdown();
			output += "Total Stats:\n" + JSON.stringify(breakdown.total, null, 2) + "\n";
			output += "Base:\n" + JSON.stringify(breakdown.base, null, 2) + "\n";
			for (const [name, stats] of Object.entries(breakdown.layers)) {
				output += `Layer ${name}:\n` + JSON.stringify(stats, null, 2) + "\n";
			}
		} else {
			const stats: Record<string, number> = {};
			for (const key of STAT_KEYS) {
				// @ts-ignore
				stats[key] = this.character.stats.get(key as any) ?? 0;
			}
			output += "Total Stats:\n" + JSON.stringify(stats, null, 2) + "\n";
		}

		// Resistances
		output += "Resistances:\n" + JSON.stringify(this.character.resistances.getAll(), null, 2) + "\n";

		// Status effects modifiers
		output += "Status Modifiers:\n";
		output += "  attack%: " + this.character.statusEffects.getAttackModifier() + "\n";
		output += "  defence%: " + this.character.statusEffects.getDefenseModifier() + "\n";
		output += "  speed%: " + this.character.statusEffects.getSpeedModifier() + "\n";

		return output;
	}

	private renderDebugStats() {
		if (!this.debugStatsEl) return;
		this.debugStatsEl.textContent = this.getDebugStatsString();
	}

	private renderAffinities() {
		if (!this.affinityRowEl) return;
		this.affinityRowEl.innerHTML = "";
		if (this.character instanceof EnemyCharacter) {
			for (const affinity of this.character.spec.affinities ?? []) {
				const iconImg = document.createElement("div");
				iconImg.className = "affinity-icon";
				iconImg.style.backgroundImage = `url(${this.getElementSymbol(affinity.element)})`;
				iconImg.style.backgroundSize = "cover";
				iconImg.style.backgroundPosition = "center";
				iconImg.style.backgroundRepeat = "no-repeat";
				this.affinityRowEl.appendChild(iconImg);
			}
		}
	}

	// Render icons to show status effects on character.

	private renderStatusEffects() {
		if (!this.statusRowEl) return;
		this.statusRowEl.innerHTML = "";
		if (!this.character) {
			this.statusRowEl.innerHTML = "";
			return;
		}
		const effects = this.character.statusEffects.getActiveEffects();
		for (const effect of effects) {
			const wrapper = document.createElement("div");
			wrapper.className = "status-icon";

			const iconUrl = this.getStatusEffectIcon(effect.id);
			if (iconUrl && iconUrl !== "?") {
				// Show icon if available
				const iconImg = document.createElement("span");
				iconImg.className = "icon";
				iconImg.style.backgroundImage = `url(${iconUrl})`;
				iconImg.style.backgroundSize = "cover";
				iconImg.style.backgroundPosition = "center";
				iconImg.style.backgroundRepeat = "no-repeat";
				wrapper.appendChild(iconImg);
			} else {
				// Show text fallback if no icon
				const textEl = document.createElement("span");
				textEl.className = "status-text";
				textEl.textContent = this.getStatusEffectName(effect.id);
				wrapper.appendChild(textEl);
			}

			const num = document.createElement("span");
			num.textContent = effect.remaining.toFixed(1);
			wrapper.appendChild(num);
			this.statusRowEl.appendChild(wrapper);
		}
	}

	private getStatusEffectIcon(effectId: string): string | null {
		switch (effectId) {
			case "slow":
				return "/images/general/icon_status_chilled.png";
			default:
				return null; // Return null instead of "?" to indicate no icon
		}
	}

	private getStatusEffectName(effectId: string): string {
		// Get the status definition to show the proper name
		const statusDef = STATUSES[effectId];
		if (statusDef) {
			return statusDef.name;
		}
		// Fallback to a formatted version of the ID
		return effectId.charAt(0).toUpperCase() + effectId.slice(1);
	}

	private getElementSymbol(element?: string): string {
		switch (element) {
			case "fire":
				return "/images/general/icon_combat_resistance_fire.png";
			case "ice":
				return "/images/general/icon_combat_resistance_ice.png";
			case "poison":
				return "/images/general/icon_combat_resistance_poison.png";
			case "lightning":
				return "/images/general/icon_combat_resistance_lightning.png";
			case "physical":
				return "/images/general/icon_combat_resistance_physical.png";
			default:
				return "?";
		}
	}

	private showHpChange(amount: number, isCrit: boolean) {
		const cls = amount < 0 ? "damage" : "heal";
		this.hpChangeEl.textContent = formatNumberShort(amount); // Math.abs(amount).toString();
		this.hpChangeEl.classList.remove("damage", "heal", "crit", "show");
		this.hpChangeEl.classList.add(cls);
		if (isCrit) this.hpChangeEl.classList.add("crit");
		// Restart animation
		void this.hpChangeEl.offsetWidth;
		this.hpChangeEl.classList.add("show");
	}

	private setHolderStatus(newStatus: HolderStatus) {
		if (newStatus === "active") {
			this.element.classList.remove("inactive");
		} else {
			this.element.classList.add("inactive");
		}
	}

	public destroy() {
		// Clean up all active transitions before destroying
		this.cleanupAllTransitions();

		super.destroy();
		// Clear maps/references
		this.character = undefined!;
		this.nameEl = undefined!;
		this.statGridEl = undefined!;
		this.hpBar = undefined!;
		this.hpValueEl = undefined!;
		this.hpChangeEl = undefined!;
		this.staminaBar = undefined!;
		this.staminaValueEl = undefined!;
		this.avatarImg = undefined!;
		this.abilitiesListEl = undefined!;
		this.affinityRowEl = undefined;
		this.statusRowEl = undefined!;
		this.element = undefined!;
		this.abilitiesListMap.clear();
		this.debugStatsEl = undefined;
	}
}
