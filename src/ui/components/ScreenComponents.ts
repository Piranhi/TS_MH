import { UIBase } from "./UIBase";

export class PageHeaderDisplay extends UIBase {
	constructor(container: HTMLElement, private pageTitle: string, private pageSubtitle: string) {
		super();
		this.element = container;
		this.createHeader();
	}

	createHeader() {
		const container = document.createElement("header");
		container.classList.add("basic-header");

		const titleContainer = document.createElement("div");
		const title = document.createElement("span");
		title.classList.add("basic-title");
		title.textContent = this.pageTitle;

		const subtitleContainer = document.createElement("div");
		const subtitle = document.createElement("span");
		subtitle.classList.add("basic-subtitle");
		subtitle.textContent = this.pageSubtitle;

		titleContainer.appendChild(title);
		subtitleContainer.appendChild(subtitle);

		container.appendChild(titleContainer);
		container.appendChild(subtitleContainer);
		this.element.prepend(container);
	}
}
