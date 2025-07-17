import { Building } from "@/features/settlement/Building";
import { UIBase } from "./UIBase";
import { bus } from "@/core/EventBus";
import profileImg from "@/Assets/Images/player-profile.png";
import { GenericModal } from "./GenericModal";

export class BuildingStatus extends UIBase {
	private levelEl!: HTMLElement;
	private nameEl!: HTMLElement;
	private portraitEl!: HTMLDivElement;
	private bonusEl!: HTMLElement;
	private assignedTextEl!: HTMLElement;

	constructor(private container: HTMLElement, private building: Building) {
		super();

		// Create main container with glass effect
		const root = document.createElement("div");
		root.className = "building-status-header glass-panel";
		this.element = root;

		// Create layout structure
		const leftSection = document.createElement("div");
		leftSection.className = "building-info-section";

		// Building name and level container
		const titleContainer = document.createElement("div");
		titleContainer.className = "building-title-container";

		this.nameEl = document.createElement("h3");
		this.nameEl.className = "building-name";
		this.nameEl.textContent = building.displayName;

		this.levelEl = document.createElement("span");
		this.levelEl.className = "building-level";

		titleContainer.appendChild(this.nameEl);
		titleContainer.appendChild(this.levelEl);
		leftSection.appendChild(titleContainer);

		// Staff section (right side)
		const staffSection = document.createElement("div");
		staffSection.className = "staff-section";

		// Portrait container
		this.portraitEl = document.createElement("div");
		this.portraitEl.className = "staff-portrait-container";
		this.portraitEl.addEventListener("click", () => this.openRecruitMenu());
		this.portraitEl.title = "Click to assign staff";

		// Staff info
		const staffInfo = document.createElement("div");
		staffInfo.className = "staff-info";

		this.assignedTextEl = document.createElement("div");
		this.assignedTextEl.className = "staff-name";

		this.bonusEl = document.createElement("div");
		this.bonusEl.className = "staff-bonus";

		staffInfo.appendChild(this.assignedTextEl);
		staffInfo.appendChild(this.bonusEl);

		staffSection.appendChild(this.portraitEl);
		staffSection.appendChild(staffInfo);

		// Assemble
		root.appendChild(leftSection);
		root.appendChild(staffSection);
		this.container.appendChild(root);

		// Add styles
		//this.injectStyles();

		// Initial update
		this.update();

		// Listen for changes
		bus.on("settlement:changed", () => this.update());
		bus.on("recruits:changed", () => this.update());
	}

	private update() {
		const snap = this.building.snapshot;
		this.levelEl.textContent = `Level ${snap.level}`;

		const recruitId = this.building.staffId;
		if (recruitId) {
			const recruit = this.context.recruits.getRecruit(recruitId);
			if (recruit) {
				// Update portrait
				this.portraitEl.innerHTML = `
                    <img src="${profileImg}" alt="${recruit.profession}" />
                    <div class="staff-rarity-indicator rarity-${recruit.rarity}"></div>
                `;

				// Update info
				this.assignedTextEl.textContent = recruit.profession;
				this.bonusEl.textContent = `+${(recruit.bondBonus * 100).toFixed(0)}% Efficiency`;
				this.bonusEl.style.display = "block";
			}
		} else {
			// Empty state
			this.portraitEl.innerHTML = `
                <div class="empty-portrait">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" fill="currentColor" opacity="0.5"/>
                        <path d="M12 14C7.59 14 4 16.69 4 20V21H20V20C20 16.69 16.41 14 12 14Z" fill="currentColor" opacity="0.5"/>
                        <path d="M19 8H17V11H14V13H17V16H19V13H22V11H19V8Z" fill="currentColor"/>
                    </svg>
                </div>
            `;
			this.assignedTextEl.textContent = "No Staff Assigned";
			this.bonusEl.style.display = "none";
		}
	}

	private openRecruitMenu() {
		const recruits = this.context.recruits.getRecruits();

		// Filter recruits by profession - only show those who can work in this building
		const eligibleRecruits = recruits.filter((recruit) => recruit.profession === this.building.requiredProfession);

		// Create custom modal content
		const modalContent = document.createElement("div");
		modalContent.className = "staff-selection-modal";

		// Header
		const header = document.createElement("div");
		header.className = "modal-header";
		header.innerHTML = `<h3>Assign Staff to ${this.building.displayName}</h3>`;
		modalContent.appendChild(header);

		// Staff grid
		const staffGrid = document.createElement("div");
		staffGrid.className = "staff-grid";

		// Add unassign option if someone is assigned
		if (this.building.staffId) {
			const unassignCard = this.createStaffCard(null, true);
			staffGrid.appendChild(unassignCard);
		}

		// Add only eligible recruits
		for (const recruit of eligibleRecruits) {
			const card = this.createStaffCard(recruit);
			staffGrid.appendChild(card);
		}

		// Show empty state if no eligible recruits
		if (eligibleRecruits.length === 0 && !this.building.staffId) {
			const emptyState = document.createElement("div");
			emptyState.className = "empty-state";
			emptyState.innerHTML = `
                <p>No ${this.building.requiredProfession} recruits available</p>
            `;
			staffGrid.appendChild(emptyState);
		}

		modalContent.appendChild(staffGrid);

		// Create modal wrapper
		const modalWrapper = document.createElement("div");
		modalWrapper.className = "modal-overlay";
		modalWrapper.addEventListener("click", (e) => {
			if (e.target === modalWrapper) {
				modalWrapper.remove();
			}
		});

		const modalInner = document.createElement("div");
		modalInner.className = "modal-content glass-panel";
		modalInner.appendChild(modalContent);
		modalWrapper.appendChild(modalInner);

		document.body.appendChild(modalWrapper);
	}

	private createStaffCard(recruit: any, isUnassign: boolean = false): HTMLElement {
		const card = document.createElement("div");
		card.className = "staff-card glass-panel";

		if (isUnassign) {
			card.innerHTML = `
                <div class="staff-card-portrait empty">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
                    </svg>
                </div>
                <div class="staff-card-info">
                    <div class="staff-card-name">Unassign</div>
                    <div class="staff-card-status">Remove current staff</div>
                </div>
            `;

			card.addEventListener("click", () => {
				const id = this.building.staffId;
				if (id) {
					this.context.recruits.unassignRecruit(id);
					this.building.assignStaff(null);
					bus.emit("settlement:changed");
					document.querySelector(".modal-overlay")?.remove();
				}
			});
		} else if (recruit) {
			const isAssigned = recruit.assignedBuilding && recruit.assignedBuilding !== this.building.id;
			const isCurrent = recruit.assignedBuilding === this.building.id;

			card.classList.toggle("assigned", isAssigned);
			card.classList.toggle("current", isCurrent);

			card.innerHTML = `
                <div class="staff-card-portrait rarity-${recruit.rarity}">
                    <img src="${profileImg}" alt="${recruit.profession}" />
                </div>
                <div class="staff-card-info">
                    <div class="staff-card-name">${recruit.profession}</div>
                    <div class="staff-card-bonus">+${(recruit.bondBonus * 100).toFixed(0)}% Efficiency</div>
                    <div class="staff-card-status">
                        ${
				isCurrent
					? "Currently Assigned"
					: isAssigned
					? `Assigned to ${this.context.settlement.getBuilding(recruit.assignedBuilding)?.displayName}`
					: "Available"
			}
                    </div>
                </div>
            `;

			if (!isCurrent) {
				card.addEventListener("click", () => {
					// First, unassign the current staff member if there is one
					if (this.building.staffId) {
						const currentStaffId = this.building.staffId;
						this.context.recruits.unassignRecruit(currentStaffId);
					}

					// Unassign from previous building if needed
					if (recruit.assignedBuilding && recruit.assignedBuilding !== this.building.id) {
						const prev = this.context.settlement.getBuilding(recruit.assignedBuilding);
						prev?.assignStaff(null);
					}

					// Assign to this building
					this.context.recruits.assignRecruit(recruit.id, this.building.id);
					this.building.assignStaff(recruit);
					bus.emit("settlement:changed");
					document.querySelector(".modal-overlay")?.remove();
				});
			}
		}

		return card;
	}
}
