import { HuntState } from "@/features/hunt/HuntManager";
import { BaseCharacter } from "@/models/BaseCharacter";
import { UIBase } from "./UIBase";
import { bindEvent } from "@/shared/utils/busUtils";
import { Player } from "@/models/player";

export type HolderStatus = "inactive" | "active";

export class CharacterDisplay extends UIBase {
	private nameEl!: HTMLElement;
	//private atkEl!: HTMLElement;
	//private defEl!: HTMLElement;
	private statsContainerEl!: HTMLElement;
	private hpBar!: HTMLElement;
	private hpLabel!: HTMLElement;
	private avatarImg!: HTMLImageElement;
	private character!: BaseCharacter;
	private abilitiesListEl!: HTMLUListElement;
	private abilitiesListMap = new Map<string, HTMLLIElement>();

	constructor(private isPlayer: boolean, private readonly charCard: HTMLElement) {
		super();

		this.element = charCard;
		this.createDisplay();
		if (isPlayer) this.setCharacter(Player.getInstance().getPlayerCharacter());

		//this.setHolderStatus(holderStatus);
		this.bindEvents();
	}

	public setCharacter(char: BaseCharacter) {
		this.character = char;
		this.setup();
	}

	private bindEvents() {
		bindEvent(this.eventBindings, "Game:UITick", (dt) => this.handleTick(dt));
		bindEvent(this.eventBindings, "hunt:stateChanged", (state) => this.huntStateChanged(state));
	}

	private handleTick(dt: number) {
		this.render();
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

	private createDisplay() {
		// CACHE ELEMENTS
		this.nameEl = this.$(".char-card__name");
		this.statsContainerEl = this.$(".stat-grid");
		//this.atkEl = this.$(".stat--attack");
		//this.defEl = this.$(".stat--defence");
		this.hpBar = this.$(".health-bar");
		this.hpLabel = this.$(".hp-label");
		this.avatarImg = this.$(".char-card__portrait") as HTMLImageElement;
		this.element.classList.add(this.isPlayer ? "player" : "enemy");
		this.abilitiesListEl = this.$(".ability-list") as HTMLUListElement;
	}

	setup() {
		const snapshot = this.character.snapshot();
		const { abilities, imgUrl } = snapshot;

		this.avatarImg.src = imgUrl;
		this.abilitiesListMap.clear();
		this.abilitiesListEl.innerHTML = "";
		//const abilities = this.character.getActiveAbilities();
		abilities.forEach((ability) => {
			const li = document.createElement("li");
			li.className = "ability";
			li.style = "--hunt-cd:0.35";
			const fill = document.createElement("span");
			fill.className = "ability-fill";
			const icon = document.createElement("span");
			icon.className = "ability-icon";
			icon.textContent = "🔥";
			const name = document.createElement("span");
			name.className = "ability-name";
			name.textContent = ability.name;
			const dmg = document.createElement("span");
			dmg.className = "ability-dmg";
			dmg.textContent = "21";

			li.appendChild(fill);
			li.appendChild(icon);
			li.appendChild(name);
			li.appendChild(dmg);
			this.abilitiesListEl.appendChild(li);
			//li.dataset.name = ability.name;
			this.abilitiesListMap.set(ability.id, li);
		});

		this.render();
	}

	async clearCharacter(): Promise<void> {
		this.character = null!;
		this.abilitiesListMap.clear();
	}

	render(): void {
		if (!this.character) return;
		const snapshot = this.character.snapshot();

		const { name, hp, abilities, imgUrl } = snapshot;
		this.nameEl.textContent = name;
		//this.atkEl.textContent = "⚔️ " + snapshot.attack.toString();
		//this.defEl.textContent = "🛡️ " + snapshot.defence.toString();
		this.hpBar.style.setProperty("--hunt-hp", hp.percent);
		this.hpLabel.textContent = `${hp.current} / ${hp.max} HP`;
		abilities.forEach((ability) => {
			const bar = this.abilitiesListMap.get(ability.id);
			if (!bar) return;
			const ratio = ability.currentCooldown / ability.maxCooldown;
			bar.style.setProperty("--hunt-cd", ratio.toString());
		});
	}

	private setHolderStatus(newStatus: HolderStatus) {
		if (newStatus === "active") {
			this.element.classList.remove("inactive");
		} else {
			this.element.classList.add("inactive");
		}
	}

	public destroy() {
		super.destroy();
		// Clear maps/references
		this.character = undefined!;
		this.character = undefined!;
		this.nameEl = undefined!;
		this.statsContainerEl = undefined!;
		this.hpBar = undefined!;
		this.hpLabel = undefined!;
		this.avatarImg = undefined!;
		this.abilitiesListEl = undefined!;
		this.element = undefined!;
		this.abilitiesListMap.clear();
	}
}
