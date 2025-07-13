import { Building } from "@/features/settlement/Building";
import { UIBase } from "./UIBase";
import { bus } from "@/core/EventBus";
import profileImg from "@/Assets/Images/player-profile.png";
import { GenericModal } from "./GenericModal";

export class BuildingStatus extends UIBase {
        private levelEl!: HTMLElement;
        private allocatedEl!: HTMLElement;
        private requiredEl!: HTMLElement;
        private portraitEl!: HTMLImageElement;
        constructor(private container: HTMLElement, private building: Building) {
		super();
		const root = document.createElement("div");
		root.classList.add("basic-section-header");
		this.element = root;

                this.portraitEl = document.createElement("img");
                this.portraitEl.className = "recruit-portrait";
                this.portraitEl.addEventListener("click", () => this.openRecruitMenu());

                const nameEl = document.createElement("span");
                nameEl.textContent = building.displayName;
                nameEl.classList.add("basic-title");
                const infoContainer = document.createElement("div");
                root.appendChild(this.portraitEl);
                root.appendChild(nameEl);
                root.append(infoContainer);

		this.levelEl = document.createElement("span");
		this.allocatedEl = document.createElement("span");
		this.requiredEl = document.createElement("span");
		infoContainer.append(this.levelEl, this.allocatedEl, this.requiredEl);
		this.container.appendChild(root);

                this.update();
                bus.on("settlement:changed", () => this.update());
                bus.on("recruits:changed", () => this.update());
        }

        private update() {
                const snap = this.building.snapshot;
		this.levelEl.textContent = `Lv ${snap.level}`;
		this.allocatedEl.textContent = `Allocated: ${snap.pointsAllocated}`;
                this.requiredEl.textContent = `Next: ${snap.nextUnlock}`;

                const recruitId = this.building.staffId;
                if (recruitId) {
                        const recruit = this.context.recruits.getRecruit(recruitId);
                        if (recruit) {
                                this.portraitEl.src = profileImg;
                                this.portraitEl.className = `recruit-portrait rarity-${recruit.rarity}`;
                                this.portraitEl.title = `Bond Bonus: ${(recruit.bondBonus * 100).toFixed(0)}%`;
                        }
                } else {
                        this.portraitEl.src = profileImg;
                        this.portraitEl.className = "recruit-portrait";
                        this.portraitEl.title = "Click to assign";
                }
        }

        private openRecruitMenu() {
                const recruits = this.context.recruits.getRecruits();
                const available = recruits.filter(
                        (r) => !r.assignedBuilding || r.assignedBuilding === this.building.id
                );

                const options = [] as { id: string; icon: string; title: string; description: string }[];

                if (this.building.staffId) {
                        options.push({
                                id: "unassign",
                                icon: "",
                                title: "Unassign",
                                description: "Remove current recruit",
                        });
                }

                for (const r of available) {
                        options.push({
                                id: r.id,
                                icon: profileImg,
                                title: `${r.profession} (${r.id})`,
                                description: `Bond ${r.bondXp} (+${(r.bondBonus * 100).toFixed(0)}%)`,
                        });
                }

                const modal = new GenericModal(
                        `Assign ${this.building.displayName}`,
                        options,
                        "Select",
                        (opt) => {
                                if (opt.id === "unassign") {
                                        const id = this.building.staffId;
                                        if (id) {
                                                this.context.recruits.unassignRecruit(id);
                                                this.building.assignStaff(null);
                                                bus.emit("settlement:changed");
                                        }
                                } else {
                                        const recruit = this.context.recruits.getRecruit(opt.id);
                                        if (recruit) {
                                                if (recruit.assignedBuilding && recruit.assignedBuilding !== this.building.id) {
                                                        const prev = this.context.settlement.getBuilding(recruit.assignedBuilding);
                                                        prev?.assignStaff(null);
                                                }
                                                this.context.recruits.assignRecruit(recruit.id, this.building.id);
                                                this.building.assignStaff(recruit);
                                                bus.emit("settlement:changed");
                                        }
                                }
                        }
                );
                modal.show();
        }
}
