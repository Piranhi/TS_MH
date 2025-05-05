import { BaseCharacter } from "@/Characters/BaseCharacter";
import { Bounded } from "@/domain/value-objects/Bounded";

export interface CharacterSnapsnot {
    name: string;
    hp: Bounded;
}

export class CharacterHolder {
    private root: HTMLElement;
    private nameEl: HTMLElement;
    private atkEl: HTMLElement;
    private defEl: HTMLElement;
    private hpBar: HTMLElement;
    private hpLabel: HTMLElement;
    private avatarImg: HTMLImageElement;
    private character!: BaseCharacter;

    constructor(root: HTMLElement) {
        this.root = root;
        this.nameEl = root.querySelector(".char-name")!;
        this.atkEl = root.querySelector(".stat--atk")!;
        this.defEl = root.querySelector(".stat--def")!;
        this.hpBar = root.querySelector(".health-bar")!;
        this.hpLabel = root.querySelector(".hp-label")!;
        this.avatarImg = root.querySelector(".char-img")!;

        // (optional) guard against missing markup in dev
        if (!this.nameEl) throw new Error("CharacterHolder: .char-name not found");
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
        const pct = hp.current / hp.max;

        this.hpBar.style.setProperty("--hp", pct.toString());
        this.hpLabel.textContent = `${hp.current} / ${hp.max} HP`;
    }
}
