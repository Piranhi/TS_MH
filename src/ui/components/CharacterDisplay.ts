import { BaseCharacter, StatKey } from "../../models/BaseCharacter";
import { Player } from "@/models/player";

export class CharacterDisplay {
	private root: HTMLElement;
	private nameEl: HTMLElement;
	private atkEl: HTMLElement;
	private defEl: HTMLElement;
	private statsContainerEl: HTMLElement;
	private hpBar: HTMLElement;
	private hpLabel: HTMLElement;
	private avatarImg: HTMLImageElement;
	private character!: BaseCharacter;

	private readonly STAT_ICONS: Record<StatKey, string> = {
		strength: "⚔️",
		defence: "🛡️",
		attackBase: "",
		attackMulti: ""
	};

	constructor(root: HTMLElement, isPlayer: boolean) {
		this.root = root;
		this.nameEl = root.querySelector(".char-name")!;
		this.statsContainerEl = root.querySelector(".char-stats")!;
		this.atkEl = root.querySelector(".stat--atk .value")!;
		this.defEl = root.querySelector(".stat--def .value")!;
		this.hpBar = root.querySelector(".health-bar")!;
		this.hpLabel = root.querySelector(".hp-label")!;
		this.avatarImg = root.querySelector(".char-img")!;
        if(isPlayer)this.setup(Player.getInstance().getPlayerCharacter())        

		// (optional) guard against missing markup in dev
		if (!this.nameEl) throw new Error("CharacterHolder: .char-name not found");
	}

	setup(character: BaseCharacter) {
		this.character = character;
		this.statsContainerEl.innerHTML = "";
		const keys = Object.keys(this.character.snapshot().stats) as StatKey[] 

        for (const key of keys){
			const span = document.createElement("span");
			span.classList.add("stat", `stat--${key}`);
			span.innerHTML = `${this.STAT_ICONS[key]} <span class="value">${this.character.snapshot().stats[key]}</span>`;
			if (key === "strength") {
				this.atkEl = span.querySelector(".stat--strength .value")!;
			} else {
				this.defEl = span.querySelector(".stat--defence .value")!;
			}
			this.statsContainerEl.appendChild(span);
		}
		this.render();
	}

	render(): void {
		if (!this.character) return;
		const snapshot = this.character.snapshot();
		const { name, hp } = snapshot;
		this.nameEl.textContent = name;
		this.atkEl.innerHTML = snapshot.stats.strength.toString();
		this.defEl.innerHTML = snapshot.stats.defence.toString();
		const pct = hp.current / hp.max;

		this.hpBar.style.setProperty("--hp", pct.toString());
		this.hpLabel.textContent = `${hp.current} / ${hp.max} HP`;
	}
}
