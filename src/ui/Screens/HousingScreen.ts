import { BaseScreen } from "./BaseScreen";
import Markup from "./housing.html?raw";
import { bus } from "../../core/EventBus";
import { bindEvent } from "@/shared/utils/busUtils";
import { RecruitProfession } from "@/models/Recruit";
import { ItemRarity } from "@/shared/types";
import { BuildingStatus } from "../components/BuildingStatus";

interface StaffMember {
	id: string;
	name: string;
	profession: RecruitProfession;
	rarity: ItemRarity;
	bondXp: number;
	assignedBuilding?: string;
	positiveTrait: string;
	negativeTrait: string;
	efficiency: number;
}

export class HousingScreen extends BaseScreen {
	readonly screenName = "housing";

	// DOM Elements
	private populationCurrentEl!: HTMLElement;
	private populationMaxEl!: HTMLElement;
	private assignedStaffEl!: HTMLElement;
	private unassignedStaffEl!: HTMLElement;
	private totalEfficiencyEl!: HTMLElement;
	private staffListEl!: HTMLElement;
	private professionSelectEl!: HTMLSelectElement;
	private filterAllEl!: HTMLInputElement;
	private filterAssignedEl!: HTMLInputElement;
	private filterUnassignedEl!: HTMLInputElement;

	// State
	private staffMembers: StaffMember[] = [];
	private filteredStaff: StaffMember[] = [];
	private currentSortBy: "name" | "profession" | "rarity" | "assignment" = "name";
	private sortDirection: "asc" | "desc" = "asc";

	constructor() {
		super();
		this.addMarkuptoPage(Markup);
	}

	init() {
		this.setupFeatureUnlock("feature.housing", () => {
			this.setupElements();
			this.bindEvents();
			this.initializeBuildingStatus();
			this.loadStaffData();
		});
	}

	private initializeBuildingStatus() {
		const statusEl = this.byId("housing-building-status") as HTMLElement;
		const building = this.context.settlement.getBuilding("housing");
		if (building && statusEl) {
			new BuildingStatus(statusEl, building);
		}
	}

	show() {
		if (!this.isFeatureActive()) return;
		this.refreshStaffList();
		this.updateStatistics();
	}

	hide() {
		// Clean up any timers or subscriptions if needed
	}

	private setupElements() {
		this.populationCurrentEl = this.byId("population-current");
		this.populationMaxEl = this.byId("population-max");
		this.assignedStaffEl = this.byId("assigned-staff");
		this.unassignedStaffEl = this.byId("unassigned-staff");
		this.totalEfficiencyEl = this.byId("total-efficiency");
		this.staffListEl = this.byId("staff-list");
		this.professionSelectEl = this.byId("profession-select") as HTMLSelectElement;
		this.filterAllEl = this.byId("filter-all") as HTMLInputElement;
		this.filterAssignedEl = this.byId("filter-assigned") as HTMLInputElement;
		this.filterUnassignedEl = this.byId("filter-unassigned") as HTMLInputElement;
	}

	private bindEvents() {
		// Event listeners for filtering
		bindEvent(this.eventBindings, "recruits:changed", () => this.refreshStaffList());

		// Filter controls
		this.bindDomEvent(this.filterAllEl, "change", () => {
			if (this.filterAllEl.checked) {
				this.filterAssignedEl.checked = false;
				this.filterUnassignedEl.checked = false;
			}
			this.applyFilters();
		});

		this.bindDomEvent(this.filterAssignedEl, "change", () => {
			if (this.filterAssignedEl.checked) {
				this.filterAllEl.checked = false;
				this.filterUnassignedEl.checked = false;
			}
			this.applyFilters();
		});

		this.bindDomEvent(this.filterUnassignedEl, "change", () => {
			if (this.filterUnassignedEl.checked) {
				this.filterAllEl.checked = false;
				this.filterAssignedEl.checked = false;
			}
			this.applyFilters();
		});

		this.bindDomEvent(this.professionSelectEl, "change", () => this.applyFilters());

		// Sort buttons
		this.bindDomEvent(this.byId("sort-by-name"), "click", () => this.sortStaff("name"));
		this.bindDomEvent(this.byId("sort-by-profession"), "click", () => this.sortStaff("profession"));
		this.bindDomEvent(this.byId("sort-by-rarity"), "click", () => this.sortStaff("rarity"));
		this.bindDomEvent(this.byId("sort-by-assignment"), "click", () => this.sortStaff("assignment"));
	}

	private loadStaffData() {
		// Get all recruits from the context
		const recruits = this.context.recruits.getRecruits();

		this.staffMembers = recruits.map((recruit) => ({
			id: recruit.id,
			name: recruit.displayName,
			profession: recruit.profession,
			rarity: recruit.rarity,
			bondXp: recruit.bondXp,
			assignedBuilding: recruit.assignedBuilding,
			positiveTrait: recruit.positiveTrait?.name || "None",
			negativeTrait: recruit.negativeTrait?.name || "None",
			efficiency: this.calculateEfficiency(recruit.bondXp),
		}));

		this.filteredStaff = [...this.staffMembers];
	}

	private calculateEfficiency(bondXp: number): number {
		// 1% per 100 bond XP
		return Math.floor(bondXp / 100);
	}

	private refreshStaffList() {
		this.loadStaffData();
		this.applyFilters();
		this.updateStatistics();
	}

	private updateStatistics() {
		const totalStaff = this.staffMembers.length;
		const assignedStaff = this.staffMembers.filter((s) => s.assignedBuilding).length;
		const unassignedStaff = totalStaff - assignedStaff;
		const totalEfficiency = this.staffMembers.reduce((sum, s) => sum + s.efficiency, 0);

		// Update population display
		this.populationCurrentEl.textContent = totalStaff.toString();
		this.populationMaxEl.textContent = "50"; // This could be dynamic based on housing level

		// Update staff statistics
		this.assignedStaffEl.textContent = assignedStaff.toString();
		this.unassignedStaffEl.textContent = unassignedStaff.toString();
		this.totalEfficiencyEl.textContent = `+${totalEfficiency}%`;
	}

	private applyFilters() {
		let filtered = [...this.staffMembers];

		// Apply assignment filter
		if (this.filterAssignedEl.checked) {
			filtered = filtered.filter((s) => s.assignedBuilding);
		} else if (this.filterUnassignedEl.checked) {
			filtered = filtered.filter((s) => !s.assignedBuilding);
		}

		// Apply profession filter
		const selectedProfession = this.professionSelectEl.value;
		if (selectedProfession) {
			filtered = filtered.filter((s) => s.profession === selectedProfession);
		}

		this.filteredStaff = filtered;
		this.sortStaff(this.currentSortBy);
	}

	private sortStaff(sortBy: "name" | "profession" | "rarity" | "assignment") {
		if (this.currentSortBy === sortBy) {
			this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
		} else {
			this.currentSortBy = sortBy;
			this.sortDirection = "asc";
		}

		this.filteredStaff.sort((a, b) => {
			let aValue: string | number;
			let bValue: string | number;

			switch (sortBy) {
				case "name":
					aValue = a.name;
					bValue = b.name;
					break;
				case "profession":
					aValue = a.profession;
					bValue = b.profession;
					break;
				case "rarity":
					aValue = this.getRarityOrder(a.rarity);
					bValue = this.getRarityOrder(b.rarity);
					break;
				case "assignment":
					aValue = a.assignedBuilding || "Unassigned";
					bValue = b.assignedBuilding || "Unassigned";
					break;
				default:
					aValue = a.name;
					bValue = b.name;
			}

			if (this.sortDirection === "asc") {
				return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
			} else {
				return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
			}
		});

		this.renderStaffList();
	}

	private getRarityOrder(rarity: ItemRarity): number {
		const rarityOrder: { [key in ItemRarity]: number } = {
			common: 1,
			uncommon: 2,
			rare: 3,
			epic: 4,
			legendary: 5,
			mythic: 6,
		};
		return rarityOrder[rarity] || 0;
	}

	private renderStaffList() {
		this.staffListEl.innerHTML = "";

		if (this.filteredStaff.length === 0) {
			const emptyMessage = document.createElement("div");
			emptyMessage.className = "empty-staff-message";
			emptyMessage.textContent = "No staff members found matching your filters.";
			this.staffListEl.appendChild(emptyMessage);
			return;
		}

		this.filteredStaff.forEach((staff) => {
			const staffCard = this.createStaffCard(staff);
			this.staffListEl.appendChild(staffCard);
		});
	}

	private createStaffCard(staff: StaffMember): HTMLElement {
		const card = document.createElement("div");
		card.className = `staff-card rarity-${staff.rarity}`;
		card.dataset.staffId = staff.id;

		const assignmentText = staff.assignedBuilding ? this.getDisplayName(staff.assignedBuilding) : "Unassigned";

		card.innerHTML = `
            <div class="staff-portrait">
                <div class="staff-avatar rarity-${staff.rarity}">
                    ${this.getProfessionIcon(staff.profession)}
                </div>
                <div class="staff-rarity-badge rarity-${staff.rarity}">
                    ${staff.rarity.charAt(0).toUpperCase() + staff.rarity.slice(1)}
                </div>
            </div>
            <div class="staff-details">
                <div class="staff-name">${staff.name}</div>
                <div class="staff-profession">${staff.profession.charAt(0).toUpperCase() + staff.profession.slice(1)}</div>
                <div class="staff-assignment">${assignmentText}</div>
                <div class="staff-efficiency">+${staff.efficiency}% Efficiency</div>
            </div>
            <div class="staff-traits">
                <div class="trait positive">
                    <span class="trait-label">+</span>
                    <span class="trait-name">${staff.positiveTrait}</span>
                </div>
                <div class="trait negative">
                    <span class="trait-label">-</span>
                    <span class="trait-name">${staff.negativeTrait}</span>
                </div>
            </div>
            <div class="staff-actions">
                <button class="action-button reassign-btn" data-staff-id="${staff.id}">
                    Reassign
                </button>
                <button class="action-button kick-btn" data-staff-id="${staff.id}">
                    Kick
                </button>
            </div>
        `;

		// Add event listeners for action buttons
		const reassignBtn = card.querySelector(".reassign-btn") as HTMLButtonElement;
		const kickBtn = card.querySelector(".kick-btn") as HTMLButtonElement;

		reassignBtn.addEventListener("click", () => this.reassignStaff(staff.id));
		kickBtn.addEventListener("click", () => this.kickStaff(staff.id));

		return card;
	}

	private getProfessionIcon(profession: RecruitProfession): string {
		const icons: { [key in RecruitProfession]: string } = {
			blacksmith: "🔨",
			miner: "⛏️",
			librarian: "📚",
			builder: "🏗️",
			apothecary: "🧪",
			scout: "🗺️",
		};
		return icons[profession] || "👤";
	}

	private getDisplayName(buildingType: string): string {
		const displayNames: { [key: string]: string } = {
			guild_hall: "Guild Hall",
			mine: "Mine",
			library: "Library",
			blacksmith: "Blacksmith",
			market: "Market",
			housing: "Housing",
		};
		return displayNames[buildingType] || buildingType;
	}

	private reassignStaff(staffId: string) {
		// This would open a modal or dialog for reassigning staff
		// For now, we'll just emit an event
		bus.emit("housing:reassignStaff", staffId);
	}

	private kickStaff(staffId: string) {
		const staff = this.staffMembers.find((s) => s.id === staffId);
		if (staff && confirm(`Are you sure you want to dismiss ${staff.name}? This action cannot be undone.`)) {
			// Emit event to dismiss the recruit
			bus.emit("recruit:dismiss", staffId);
		}
	}

	public destroy() {
		super.destroy();
	}
}
