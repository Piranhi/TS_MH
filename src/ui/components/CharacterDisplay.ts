import { BaseCharacter } from "@/models/BaseCharacter";

export class CharacterDisplay {
    //private root: HTMLElement;
    private nameEl!: HTMLElement;
    private atkEl!: HTMLElement;
    private defEl!: HTMLElement;
    private statsContainerEl!: HTMLElement;
    private hpBar!: HTMLElement;
    private hpLabel!: HTMLElement;
    private avatarImg!: HTMLImageElement;
    private character!: BaseCharacter;

    constructor(private isPlayer: boolean) {
        this.createDisplay();
    }

    private createDisplay() {
        // IMPORT TEMPLATE
        const tmpl = document.getElementById("character-display") as HTMLTemplateElement;
        if (!tmpl) throw new Error("Template #character-display not found");
        const frag = tmpl.content.cloneNode(true) as DocumentFragment;
        const charDisplayEl = frag.querySelector<HTMLElement>(".char-holder");
        if (!charDisplayEl) throw new Error(".char-holder not found in template");

        // CACHE ELEMENTS
        this.nameEl = charDisplayEl.querySelector(".char-name")!;
        this.statsContainerEl = charDisplayEl.querySelector(".char-stats")!;
        this.atkEl = charDisplayEl.querySelector(".stat--attack")!;
        this.defEl = charDisplayEl.querySelector(".stat--defence")!;
        this.hpBar = charDisplayEl.querySelector(".health-bar")!;
        this.hpLabel = charDisplayEl.querySelector(".hp-label")!;
        this.avatarImg = charDisplayEl.querySelector(".char-img")!;

        charDisplayEl.classList.add(this.isPlayer ? "player" : "enemy");

        const container = document.querySelector<HTMLElement>(".char-holders")!;
        container.appendChild(charDisplayEl);
    }

    setup(character: BaseCharacter) {
        this.character = character;
        this.render();
    }

    render(): void {
        if (!this.character) return;
        const snapshot = this.character.snapshot();
        const { name, hp } = snapshot;
        this.nameEl.textContent = name;
        this.atkEl.textContent = "⚔️ " + snapshot.stats.attack.toString();
        this.defEl.textContent = "🛡️ " + snapshot.stats.defence.toString();
        const pct = hp.current / hp.max;

        this.hpBar.style.setProperty("--hp", pct.toString());
        this.hpLabel.textContent = `${hp.current} / ${hp.max} HP`;
    }
}
