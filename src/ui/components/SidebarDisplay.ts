import { bus } from "@/core/EventBus";
import { prettify } from "../../shared/utils/stringUtils";
import { ScreenName, screenNav, ScreenNav } from "@/shared/ui-types";
import { UIBase } from "./UIBase";

export class SidebarDisplay extends UIBase {
	private sidebarMap = new Map<ScreenName, HTMLLIElement>();
	private navContainer = document.getElementById("sidebar")!;
	constructor(private onSelect: (name: ScreenName) => void) {
		super();
	}

	public build() {
		this.navContainer.innerHTML = "";
		const ul = document.createElement("ul");
		this.buildNavItems(screenNav, ul);
		this.navContainer.append(ul);

		bus.on("ui:screenChanged", (screen) => {
			for (const [name, li] of this.sidebarMap) {
				if (name === screen) li.classList.add("active");
				else li.classList.remove("active");
			}
		});
	}

	private buildNavItems(items: ScreenNav[], parent: HTMLElement, depth = 0) {
		for (const item of items) {
			const li = document.createElement("li");
			const btn = document.createElement("button");
			// Create Icons
			const icon = document.createElement("span");
			icon.classList.add("icon");
			icon.textContent = "🏠";
			btn.append(icon);

			btn.textContent = btn.textContent + prettify(item.name);

			// Style sub-buttons differently
			if (depth > 0) {
				btn.classList.add("nav-subbtn");
				btn.style.paddingLeft = `${16 + 16 * depth}px`;
			} else {
				btn.classList.add("nav-btn");
			}

			btn.addEventListener("click", () => this.onSelect(item.name));
			li.append(btn);

			this.sidebarMap.set(item.name, li);

			// Create Counters
			const counter = document.createElement("span");
			counter.classList.add("badge");
			counter.textContent = "5";
			btn.append(counter);

			// Recursively add children
			if (item.children && item.children.length > 0) {
				const subUl = document.createElement("ul");
				subUl.classList.add("submenu-nav");
				this.buildNavItems(item.children, subUl, depth + 1);
				li.append(subUl);
			}

			parent.append(li);
		}
	}
}
