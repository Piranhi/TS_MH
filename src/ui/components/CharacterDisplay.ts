import { bus } from "@/core/EventBus";
import { HuntState } from "@/features/hunt/HuntManager";
import { BaseCharacter } from "@/models/BaseCharacter";

export type HolderStatus = "inactive" | "active";

export class CharacterDisplay {
	private root!: HTMLElement;
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
		this.createDisplay();
		this.setHolderStatus(holderStatus);
		//bus.on("player:statsChanged", )
		bus.on("hunt:stateChanged", (state) => {
			switch (state) {
				case HuntState.Recovery:
					this.setHolderStatus(isPlayer ? "inactive" : "inactive");
					break;
				case HuntState.Search:
					this.setHolderStatus(isPlayer ? "active" : "inactive");
					break;
				case HuntState.Combat:
					this.setHolderStatus(isPlayer ? "active" : "active");
					break;
				case HuntState.Idle:
					this.setHolderStatus(isPlayer ? "active" : "inactive");
					break;
			}
		});
	}

	private createDisplay() {
		const container = document.querySelector<HTMLElement>(".char-holders")!;
		// IMPORT TEMPLATE
		const tmpl = document.getElementById("character-display") as HTMLTemplateElement;
		if (!tmpl) throw new Error("Template #character-display not found");
		const frag = tmpl.content.cloneNode(true) as DocumentFragment;
		this.root = frag.querySelector<HTMLElement>(".char-holder")!;
		if (!this.root) throw new Error(".char-holder not found in template");

		// CACHE ELEMENTS
		this.nameEl = this.root.querySelector(".char-name")!;
		this.statsContainerEl = this.root.querySelector(".char-stats")!;
		this.atkEl = this.root.querySelector(".stat--attack")!;
		this.defEl = this.root.querySelector(".stat--defence")!;
		this.hpBar = this.root.querySelector(".health-bar")!;
		this.speedBar = this.root.querySelector(".speed-bar")!;
		this.hpLabel = this.root.querySelector(".hp-label")!;
		this.avatarImg = this.root.querySelector(".char-img")!;
		this.root.classList.add(this.isPlayer ? "player" : "enemy");
		this.barsContainer = this.root.querySelector(".attack-bars")!;

		container.appendChild(this.root);
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
			this.root.classList.remove("inactive");
		} else {
			this.root.classList.add("inactive");
		}
	}
}
