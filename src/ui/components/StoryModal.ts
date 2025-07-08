import { bus } from "@/core/EventBus";
import { MilestoneEventPayload } from "@/shared/Milestones";

// JSON containing dialogue keyed by milestone tag
import dialogues from "@/data/story-dialogues.json" assert { type: "json" };

// ---------------- TYPES -----------------
export interface SpeakerInfo {
    title: string;
    avatar: string; // Relative URL to avatar image
}

export interface StoryDialogue {
    speaker: SpeakerInfo;
    title: string;
    text: string[]; // Sequence of dialogue lines
}

// Type of JSON file (record of milestoneTag -> StoryDialogue)
type DialogueMap = Record<string, StoryDialogue>;

// ------------- MODAL COMPONENT -------------
class StoryModal {
    private overlay: HTMLElement;
    private textEl: HTMLElement;
    private buttonEl: HTMLButtonElement;
    private currentIndex = 0;

    constructor(private dialogue: StoryDialogue) {
        this.overlay = this.buildModal();
        this.textEl = this.overlay.querySelector(".story-dialogue-text")!;
        this.buttonEl = this.overlay.querySelector(".story-dialogue-button") as HTMLButtonElement;
    }

    private buildModal(): HTMLElement {
        // Overlay
        const overlay = document.createElement("div");
        overlay.className = "story-modal-overlay";

        // Card
        const card = document.createElement("div");
        card.className = "story-modal-card";
        overlay.appendChild(card);

        // Speaker section
        const speaker = document.createElement("div");
        speaker.className = "story-dialogue-speaker";
        speaker.innerHTML = `
            <img class="story-dialogue-avatar" src="${this.dialogue.speaker.avatar}" alt="${this.dialogue.speaker.title}" />
            <h4 class="story-dialogue-speaker-title">${this.dialogue.speaker.title}</h4>
        `;
        card.appendChild(speaker);

        // Title
        const titleEl = document.createElement("h2");
        titleEl.className = "story-dialogue-title";
        titleEl.textContent = this.dialogue.title;
        card.appendChild(titleEl);

        // Main text paragraph
        const textEl = document.createElement("p");
        textEl.className = "story-dialogue-text";
        textEl.textContent = this.dialogue.text[0] ?? "";
        card.appendChild(textEl);

        // Button
        const btn = document.createElement("button");
        btn.className = "btn primary story-dialogue-button";
        btn.textContent = this.dialogue.text.length > 1 ? "Next" : "Close";
        card.appendChild(btn);

        // Button handler
        btn.addEventListener("click", () => this.handleNext());

        return overlay;
    }

    private handleNext() {
        this.currentIndex++;
        if (this.currentIndex < this.dialogue.text.length) {
            // Show next line
            this.textEl.textContent = this.dialogue.text[this.currentIndex];
            if (this.currentIndex === this.dialogue.text.length - 1) {
                this.buttonEl.textContent = "Close";
            }
        } else {
            // End of dialogue
            this.hide();
        }
    }

    show() {
        document.body.appendChild(this.overlay);
        // Small delay to allow CSS transitions (optional)
        window.requestAnimationFrame(() => {
            this.overlay.classList.add("show");
        });
    }

    hide() {
        this.overlay.classList.remove("show");
        setTimeout(() => this.overlay.remove(), 200); // Remove after transition
    }
}

// ------------- MANAGER -------------
export class StoryModalManager {
    private static _instance: StoryModalManager;
    private dialogues: DialogueMap;

    private constructor() {
        this.dialogues = dialogues as DialogueMap;
        // Listen for milestone achievements
        bus.on("milestone:achieved", (payload: MilestoneEventPayload) => {
            const tag = payload.tag;
            const dialogue = this.dialogues[tag];
            if (dialogue) {
                this.open(dialogue);
            }
        });
    }

    static init() {
        if (!this._instance) {
            this._instance = new StoryModalManager();
        }
        return this._instance;
    }

    open(dialogue: StoryDialogue) {
        const modal = new StoryModal(dialogue);
        modal.show();
    }
}