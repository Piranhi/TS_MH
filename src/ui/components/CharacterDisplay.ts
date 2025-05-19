import { HuntState } from "@/features/hunt/HuntManager";
import { BaseCharacter } from "@/models/BaseCharacter";
import { UIBase } from "./UIBase";
import { bindEvent } from "@/shared/utils/busUtils";

export type HolderStatus = "inactive" | "active";

export class CharacterDisplay extends UIBase {
	private nameEl!: HTMLElement;
	private atkEl!: HTMLElement;
	private defEl!: HTMLElement;
	private statsContainerEl!: HTMLElement;
	private hpBar!: HTMLElement;
	private speedBar!: HTMLElement;
	private hpLabel!: HTMLElement;
	private avatarImg!: HTMLImageElement;
	private character!: BaseCharacter;
	private barsContainer!: HTMLElement;
	private attackBarMap = new Map<string, HTMLElement>();

	constructor(private holderStatus: HolderStatus, private isPlayer: boolean) {
		super();
		this.createDisplay();
		this.setHolderStatus(holderStatus);
		this.bindEvents();
	}

	private bindEvents() {
		bindEvent(this.eventBindings, "hunt:stateChanged", (state) => this.huntStateChanged(state));
	}

	private huntStateChanged(state: HuntState) {
		switch (state) {
			case HuntState.Recovery:
				this.setHolderStatus(this.isPlayer ? "inactive" : "inactive");
				break;
			case HuntState.Search:
				this.setHolderStatus(this.isPlayer ? "active" : "inactive");
				break;
			case HuntState.Combat:
				this.setHolderStatus(this.isPlayer ? "active" : "active");
				break;
			case HuntState.Idle:
				this.setHolderStatus(this.isPlayer ? "active" : "inactive");
				break;
			case HuntState.Boss:
				this.setHolderStatus(this.isPlayer ? "active" : "active");
				break;
		}
	}

	public destroy() {
		// Remove DOM node
		if (this.element && this.element.parentNode) {
			this.element.parentNode.removeChild(this.element);
		}

		// Clear maps/references
		this.attackBarMap.clear();
		this.character = undefined!;
	}

	private createDisplay() {
		const container = document.querySelector<HTMLElement>(".char-holders")!;
		// IMPORT TEMPLATE
		const tmpl = document.getElementById("character-display") as HTMLTemplateElement;
		if (!tmpl) throw new Error("Template #character-display not found");
		const frag = tmpl.content.cloneNode(true) as DocumentFragment;
		this.element = frag.querySelector<HTMLElement>(".char-holder")!;
		if (!this.element) throw new Error(".char-holder not found in template");

		// CACHE ELEMENTS
		this.nameEl = this.$(".char-name");
		this.statsContainerEl = this.$(".char-stats");
		this.atkEl = this.$(".stat--attack");
		this.defEl = this.$(".stat--defence");
		this.hpBar = this.$(".health-bar");
		this.speedBar = this.$(".speed-bar");
		this.hpLabel = this.$(".hp-label");
		this.avatarImg = this.$(".char-img") as HTMLImageElement;
		this.element.classList.add(this.isPlayer ? "player" : "enemy");
		this.barsContainer = this.$(".attack-bars");

		this.attachTo(container);
	}

	setup(character: BaseCharacter) {
		this.character = character;
		this.attackBarMap.clear();
		this.barsContainer.innerHTML = "";
		const abilities = this.character.getActiveAbilities();
		abilities.forEach((ability) => {
			const bar = document.createElement("div");
			this.attackBarMap.set(ability.id, bar);
			bar.className = "attack-bar";
			bar.style.setProperty("--cd", String(ability.currentCooldown / ability.maxCooldown));
			bar.dataset.name = ability.name;

			const fill = document.createElement("span");
			fill.className = "attack-fill";
			bar.appendChild(fill);

			const label = document.createElement("small");
			label.className = "attack-label";
			label.textContent = ability.name;
			bar.appendChild(label);

			this.barsContainer.appendChild(bar);
		});
		this.render();
	}

	clearCharacter(): void {}

	render(): void {
		if (!this.character) return;
		const snapshot = this.character.snapshot();

		const { name, hp, abilities } = snapshot;
		this.nameEl.textContent = name;
		this.atkEl.textContent = "⚔️ " + snapshot.attack.toString();
		this.defEl.textContent = "🛡️ " + snapshot.defence.toString();
		this.hpBar.style.setProperty("--hp", hp.percent);
		this.hpLabel.textContent = `${hp.current} / ${hp.max} HP`;
		abilities.forEach((ability) => {
			const bar = this.attackBarMap.get(ability.id);
			if (!bar) return;
			const ratio = ability.currentCooldown / ability.maxCooldown;
			bar.style.setProperty("--cd", ratio.toString());
		});
	}

	private setHolderStatus(newStatus: HolderStatus) {
		if (newStatus === "active") {
			this.element.classList.remove("inactive");
		} else {
			this.element.classList.add("inactive");
		}
	}
}
