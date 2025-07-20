import { prettify } from "../../shared/utils/stringUtils";
import { progressionUnlockRequirements, ScreenName, screenNav, ScreenNav } from "@/shared/ui-types";
import { UIBase } from "./UIBase";
import { MilestoneManager } from "@/models/MilestoneManager";
import { bindEvent } from "@/shared/utils/busUtils";

export class SidebarDisplay extends UIBase {
	private sidebarMap = new Map<ScreenName, HTMLLIElement>();
	private navContainer = document.getElementById("sidebar")!;
	private navList!: HTMLUListElement;

	constructor(private onSelect: (name: ScreenName) => void) {
		super();
	}

	public build() {
		this.navContainer.innerHTML = "";

		// Add glass effect to sidebar container
		this.navContainer.classList.add("menu-nav-glass");

		this.navList = document.createElement("ul");
		this.navList.className = "nav-list";
		this.buildNavItems(screenNav, this.navList);
		this.navContainer.append(this.navList);

		bindEvent(this.eventBindings, "ui:screenChanged", (screen) => {
			for (const [name, li] of this.sidebarMap) {
				if (name === screen) {
					li.classList.add("active");
					// Add glow effect to active item
					li.querySelector("button")?.classList.add("glass-glow");
				} else {
					li.classList.remove("active");
					li.querySelector("button")?.classList.remove("glass-glow");
				}
			}
		});
		bindEvent(this.eventBindings, "ui:screenUnlocked", () => {
			this.buildNavItems(screenNav, this.navList);
		});
	}

	private buildNavItems(items: ScreenNav[], parent: HTMLElement, depth = 0) {
		parent.innerHTML = "";
		for (const item of items) {
			if (progressionUnlockRequirements.has(item.name)) {
				if (!MilestoneManager.instance.hasAll(progressionUnlockRequirements.get(item.name)!)) {
					continue;
				}
			}
			const li = document.createElement("li");
			li.className = "nav-item";

			const btn = document.createElement("button");
			btn.className = "nav-btn glass-nav-btn";

			// Create Icons with better styling
			const icon = document.createElement("span");
			icon.classList.add("icon");
			icon.textContent = this.getIconForScreen(item.name);
			btn.append(icon);

			// Add text
			const text = document.createElement("span");
			text.className = "nav-text";
			text.textContent = prettify(item.name);
			btn.append(text);

			// Style sub-buttons differently
			if (depth > 0) {
				btn.classList.add("nav-subbtn");
				btn.style.paddingLeft = `${16 + 16 * depth}px`;
			}

			// Add hover effect
			btn.addEventListener("mouseenter", () => {
				btn.classList.add("hover");
			});

			btn.addEventListener("mouseleave", () => {
				btn.classList.remove("hover");
			});

			btn.addEventListener("click", () => this.onSelect(item.name));
			li.append(btn);

			this.sidebarMap.set(item.name, li);

			// Create Counter badge with glass effect
			if (this.shouldShowBadge(item.name)) {
				const counter = document.createElement("span");
				counter.classList.add("badge", "glass-badge");
				counter.textContent = this.getBadgeCount(item.name);
				btn.append(counter);
			}

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

	// Helper method to get icons for each screen
	private getIconForScreen(screenName: ScreenName): string {
		const iconMap: Record<ScreenName, string> = {
			train: "💪",
			hunt: "⚔️",
			settlement: "🏘️",
			character: "👤",
			inventory: "🎒",
			bestiary: "📖",
			outposts: "🏕️",
			guildHall: "🏰",
			housing: "🏠",
			mine: "⛏️",
			library: "📚",
			blacksmith: "🔨",
			market: "🛒",
			research: "🔬",
		};
		return iconMap[screenName] || "📋";
	}

	// Helper method to determine if badge should be shown
	private shouldShowBadge(screenName: ScreenName): boolean {
		// Add logic here for which screens should show badges
		const badgeScreens: ScreenName[] = ["inventory", "market", "blacksmith"];
		return badgeScreens.includes(screenName);
	}

	// Helper method to get badge count
	private getBadgeCount(screenName: ScreenName): string {
		// This would connect to your actual game data
		// For now, returning example values
		switch (screenName) {
			case "inventory":
				return "12";
			case "market":
				return "3";
			case "blacksmith":
				return "5";
			default:
				return "0";
		}
	}
}
