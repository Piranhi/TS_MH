export interface TooltipListItem {
	text: string;
	className?: string;
}

export interface TooltipData {
	icon: string;
	name: string;
	rarity?: string;
	type?: string;
	stats?: string[];
	heirloom?: number;
	description?: string;
	tintColour?: string;
	list?: (string | TooltipListItem)[];
}

export class Tooltip {
	private static _instance: Tooltip;
	static get instance() {
		return (this._instance ??= new Tooltip());
	}

	private root: HTMLElement;
	private hideTimeout: number | null = null;

	private constructor() {
		this.root = document.createElement("div");
		this.root.id = "item-tooltip";
		this.root.className = "item-tooltip";
		this.root.hidden = true;
		this.root.innerHTML = `
			<header class="tooltip-header">
				<img class="tooltip-icon" />
				<h3 class="tooltip-name"></h3>
			</header>
			<p class="tooltip-type"></p>
			<p class="tooltip-heirloom"></p>
			<ul class="tooltip-stats"></ul>
			<p class='tooltip-description'></p>
			<ul class='tooltip-list'></ul>
		`;
		document.body.appendChild(this.root);

		// Keep visible when pointer enters tooltip
		this.root.addEventListener("mouseenter", () => this.cancelHide());
		this.root.addEventListener("mouseleave", () => this.hide());
	}

	/** Show next to target element */
	show(target: HTMLElement, data: TooltipData) {
		this.cancelHide();

		// Fill‑in
		(this.$(".tooltip-icon") as HTMLImageElement).src = data.icon;
		this.$(".tooltip-name").textContent = data.name;
		this.$(".tooltip-type").textContent = `${data.type ?? ""} • ${data.rarity ?? ""}`.trim();
		this.fillStats(data.stats ?? []);
		this.$(".tooltip-heirloom").textContent = data.heirloom ? `Heirloom: ${data.heirloom}` : "";
		this.$(".tooltip-description").textContent = data.description ?? "";
		this.fillList(data.list ?? []);

		// Optional tint
		if (data.tintColour) {
			this.root.style.setProperty("--tooltip-tint", this.getRarityColor(data.tintColour));
		} else {
			this.root.style.removeProperty("--tooltip-tint");
		}

		// Position
		const r = target.getBoundingClientRect();
		this.root.style.top = `${r.top + window.scrollY}px`;
		this.root.style.left = `${r.right + 12 + window.scrollX}px`;

		// Reveal
		this.root.hidden = false;
		this.root.classList.add("show");
	}

	hide(delay = 50) {
		this.root.classList.remove("show");
		this.hideTimeout = window.setTimeout(() => (this.root.hidden = true), delay);
	}

	private cancelHide() {
		if (this.hideTimeout) {
			clearTimeout(this.hideTimeout);
			this.hideTimeout = null;
		}
	}

	private fillStats(lines: string[]) {
		const ul = this.$(".tooltip-stats");
		ul.innerHTML = lines.map((line) => `<li>${line}</li>`).join("");
	}

	private fillList(items: (string | TooltipListItem)[]) {
		const ul = this.$(".tooltip-list");
		ul.innerHTML = items.map((item) => {
			if (typeof item === "string") {
				return `<li>${item}</li>`;
			} else {
				const className = item.className ? ` class="${item.className}"` : "";
				return `<li${className}>${item.text}</li>`;
			}
		}).join("");
	}

	private $(sel: string) {
		return this.root.querySelector(sel)!;
	}

	private getRarityColor(rarity: string): string {
		switch (rarity) {
			case "common":
				return "rgba(136,136,136,0.15)";
			case "uncommon":
				return "rgba(76,175,80,0.15)";
			case "rare":
				return "rgba(33,150,243,0.15)";
			case "epic":
				return "rgba(156,39,176,0.15)";
			case "legendary":
				return "rgba(255,215,0,0.12)";
			case "unique":
				return "rgba(233,30,99,0.15)";
			default:
				return "rgba(255,255,255,0.05)";
		}
	}
}
