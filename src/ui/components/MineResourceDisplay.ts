import { constructionResourceType } from "@/shared/types";
import { UIBase } from "./UIBase";

export class MineResourceDisplay extends UIBase {
	constructor(private readonly resourceType: constructionResourceType, parent: HTMLElement) {
		super();
		console.log(this.element);
		const test = document.createElement("div");
		test.textContent = "fawfawf";
		this.element = test;
		this.attachTo(parent);
	}
}
