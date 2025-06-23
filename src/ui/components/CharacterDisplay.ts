import { BaseCharacter, PowerLevel } from "@/models/BaseCharacter";
import { UIBase } from "./UIBase";
import { Tooltip } from "./Tooltip";

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
    private hpBar!: HTMLElement;
    private hpLabel!: HTMLElement;
    private staminaBar!: HTMLElement;
    private staminaLabel!: HTMLElement;
    private avatarImg!: HTMLImageElement;
    private abilitiesListEl!: HTMLUListElement;
    private abilitiesListMap = new Map<string, HTMLElement>();

    // Track active transitions for cleanup
    private activeTransitions = new Map<string, TransitionCleanup>();

    constructor(public readonly isPlayer: boolean, element: HTMLElement) {
        super();
        this.element = element;
        this.createDisplay();
    }

    receiveCharacter(char: BaseCharacter): void {
        this.character = char;
        this.setup();
    }

    /* 	revive() {
		switch (this.character.type) {
			case "PLAYER":
				bindEvent(this.eventBindings, "player:charDataChanged", () => this.render());
				break;
			case "ENEMY":
				bindEvent(this.eventBindings, "enemy:charDataChanged", () => this.render());
				bindEvent(this.eventBindings, "enemy:holderStatus", (val: HolderStatus) =>
					this.setHolderStatus(val === "active" ? "active" : "active")
				);
				break;
		}
	} */

    private createDisplay() {
        // CACHE ELEMENTS
        this.nameEl = this.$(".char-card__name");
        this.statGridEl = this.$(".stat-grid");
        this.hpBar = this.$(".health-bar");
        this.hpLabel = this.$(".hp-label");
        this.staminaBar = this.$(".stamina-bar");
        this.staminaLabel = this.$(".stamina-label");

        this.avatarImg = this.$(".char-card__portrait") as HTMLImageElement;
        this.element.classList.add(this.isPlayer ? "player" : "enemy");
        this.abilitiesListEl = this.$(".ability-list") as HTMLUListElement;
    }

    setup() {
        const snapshot = this.character.snapshot();
        const { abilities, imgUrl, level } = snapshot;

        this.avatarImg.src = imgUrl;
        this.abilitiesListMap.clear();
        this.abilitiesListEl.innerHTML = "";

        abilities.forEach((ability) => {
            const li = document.createElement("li");
            li.className = "ability";
            li.dataset.abilityId = ability.id;
            li.setAttribute("draggable", "true");

            // Create the fill element that will show progress
            const fill = document.createElement("span");
            fill.className = "ability-fill ability-fill--smooth"; // Add smooth class

            const icon = document.createElement("span");
            icon.className = "ability-icon";
            icon.textContent = "🔥";

            const name = document.createElement("span");
            name.className = "ability-name";
            name.textContent = ability.name;

            const dmg = document.createElement("span");
            dmg.className = "ability-dmg";
            dmg.textContent = "21";

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
                    icon: ability.spec.iconUrl,
                    name: ability.name,
                    description: `Cost: ${ability.spec.staminaCost} stamina`,
                });
            });
            li.addEventListener("mouseleave", () => Tooltip.instance.hide());

            li.appendChild(fill);
            li.appendChild(icon);
            li.appendChild(name);
            li.appendChild(dmg);
            li.appendChild(toggle);
            this.abilitiesListEl.appendChild(li);

            this.abilitiesListMap.set(ability.id, li);
        });

        this.render();
    }

    async clearCharacter(): Promise<void> {
        this.character = null!;
        this.abilitiesListMap.clear();
        this.cleanupAllTransitions(); // Clean up any active transitions
    }

    render(): void {
        if (!this.character) return;
        const snapshot = this.character.snapshot();

        const { name, realHP: hp, stamina, abilities, imgUrl } = snapshot;
        this.nameEl.textContent = name;
        this.hpBar.style.setProperty("--hunt-hp", hp.percent);
        this.hpLabel.textContent = `${hp.current} / ${hp.max} HP`;
        this.staminaBar.style.setProperty("--hunt-stamina", stamina.percent);
        this.staminaLabel.textContent = `${stamina.current} / ${stamina.max} ST`;

        abilities.forEach((ability) => {
            const bar = this.abilitiesListMap.get(ability.id);
            if (!bar) return;

            const toggle = bar.querySelector(".ability-toggle") as HTMLInputElement;
            if (toggle) toggle.checked = ability.enabled;

            // Calculate readiness percentage (inverse of cooldown)
            // When currentCooldown is 0, ability is ready (100%)
            // When currentCooldown equals maxCooldown, ability just used (0%)
            const readinessRatio = ability.maxCooldown > 0 ? 1 - ability.currentCooldown / ability.maxCooldown : 1; // Default to ready if no cooldown

            this.updateAbilityProgress(ability.id, bar, readinessRatio);
        });

        this.createStatsGrid();
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
        });
    }

    private createStatsGrid() {
        this.statGridEl.innerHTML = "";

        const powerStats: PowerLevel = this.character.getPowerLevel();
        for (const [key, value] of Object.entries(powerStats)) {
            const wrapper = document.createElement("div");
            const dt = document.createElement("dt");
            dt.textContent = key;
            const dd = document.createElement("dd");
            dd.textContent = value;
            wrapper.appendChild(dt);
            wrapper.appendChild(dd);
            this.statGridEl.appendChild(wrapper);
        }
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
        this.hpLabel = undefined!;
        this.staminaBar = undefined!;
        this.staminaLabel = undefined!;
        this.avatarImg = undefined!;
        this.abilitiesListEl = undefined!;
        this.element = undefined!;
        this.abilitiesListMap.clear();
    }
}
