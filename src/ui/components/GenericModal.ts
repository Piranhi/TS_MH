import { UIBase } from "./UIBase";

// Define the type for your modal options
export interface ModalOption {
    id: string;
    icon?: string;
    title: string;
    description?: string;
    cost?: string; // Or structure as needed
}

// Callback when an option is confirmed
type ModalConfirmHandler = (selected: ModalOption) => void;

export class GenericModal extends UIBase {
    private overlayEl: HTMLElement;
    private listEl: HTMLElement;
    private confirmBtn: HTMLButtonElement;
    private selectedOption: ModalOption | null = null;
    private confirmHandler: ModalConfirmHandler | null = null;

    constructor(title: string, options: ModalOption[], confirmBtnLabel = "Select", onConfirm?: ModalConfirmHandler) {
        super();
        this.overlayEl = document.getElementById("genericModal")!;
        this.listEl = document.getElementById("genericModalList")!;
        this.confirmBtn = document.getElementById("genericModalButton") as HTMLButtonElement;

        // Set heading and button label
        this.overlayEl.querySelector("h2")!.textContent = title;
        this.confirmBtn.textContent = confirmBtnLabel;

        // Populate options
        this.populateList(options);

        // Set up handler
        this.confirmHandler = onConfirm || null;

        // Disable confirm button until selection
        this.confirmBtn.disabled = true;
        this.confirmBtn.onclick = () => {
            if (this.selectedOption && this.confirmHandler) {
                this.confirmHandler(this.selectedOption);
                this.hide();
            }
        };
    }

    private populateList(options: ModalOption[]) {
        this.listEl.innerHTML = ""; // Clear previous
        options.forEach((opt) => {
            const div = document.createElement("div");
            div.className = "generic-modal-option";
            div.innerHTML = `
        ${opt.icon ? `<img src="${opt.icon}" alt="${opt.title}" />` : ""}
        <div>
          <h3>${opt.title}</h3>
          ${opt.description ? `<p>${opt.description}</p>` : ""}
          ${opt.cost ? `<div class="cost">${opt.cost}</div>` : ""}
        </div>
      `;
            div.onclick = () => this.handleSelect(div, opt);
            this.listEl.appendChild(div);
        });
    }

    private handleSelect(div: HTMLElement, option: ModalOption) {
        // Deselect all
        this.listEl.querySelectorAll(".generic-modal-option").forEach((el) => el.classList.remove("selected"));
        // Select current
        div.classList.add("selected");
        this.selectedOption = option;
        this.confirmBtn.disabled = false;
    }

    public show() {
        this.overlayEl.style.display = "flex";
    }

    public hide() {
        this.overlayEl.style.display = "none";
        // Optionally, reset state for reuse
        this.listEl.innerHTML = "";
        this.selectedOption = null;
        this.confirmBtn.disabled = true;
    }
}
