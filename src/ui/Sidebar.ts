import { ScreenName } from "../shared/types/types";
import { prettify } from "../shared/utils/stringUtils";

export class Sidebar {
    private navContainer = document.getElementById('sidebar')!;
	constructor(
        private container: HTMLElement,
        private items: ScreenName[],
        private onSelect: (name: ScreenName) => void
        
    ) {}

	public build() {
        this.container.innerHTML = "";

		const ul = document.createElement("ul")
		ul.classList.add("sidebar");

		this.navContainer.append(ul);

		for (const name of this.items) {
			const li = document.createElement("li");
			const btn = document.createElement("button");
			btn.textContent = prettify(name);
			btn.addEventListener("click", () => this.onSelect(name));
			li.append(btn);
			ul.append(li);
		}

        this.container.append(ul)
	}
}
