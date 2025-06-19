import { BuildingGridItem } from "../Screens/SettlementScreen";
import { GenericModal, ModalOption } from "./GenericModal";
import { UIBase } from "./UIBase";

export class PlotDisplay extends UIBase implements BuildingGridItem {
	private onUnlockClick: ((e: Event) => void) | null = null;
	private unlockBtn: HTMLButtonElement | null = null;
	id = "none";
	type: "plot" = "plot";
	constructor(private BuildingGridEl: HTMLElement, private template: HTMLTemplateElement) {
		super();
		const frag = this.template.content.cloneNode(true) as DocumentFragment;
		const root = frag.firstElementChild as HTMLElement;
		if (!root) return;
		this.unlockBtn = root.querySelector(".build-btn") as HTMLButtonElement;
		this.onUnlockClick = () => this.showModal();
		this.unlockBtn?.addEventListener("click", this.onUnlockClick);
		this.element = root;
		this.attachTo(this.BuildingGridEl);
	}

	destroy() {
		super.destroy();
		if (this.onUnlockClick) {
			this.unlockBtn?.removeEventListener("click", this.onUnlockClick);
			this.onUnlockClick = null;
		}
	}

	showModal() {
		const options: ModalOption[] = [
			{
				id: "blacksmith",
				icon: "icons/blacksmith.png",
				title: "Blacksmith",
				description: "Forge and upgrade weapons. Unlocks crafting.",
				cost: "200 Stone, 100 Wood",
			},
			{
				id: "library",
				icon: "icons/library.png",
				title: "Library",
				description: "Research new skills, abilities, and traits.",
				cost: "150 Stone, 150 Wood",
			},
			// more...
		];
		console.log("hlle");

		const modal = new GenericModal("Select a building", options, "Build");
		modal.show();
	}
}
