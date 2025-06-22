import { BaseScreen } from "./BaseScreen";
import Markup from "./character.html?raw";
import { bus } from "@/core/EventBus";
import { Tooltip } from "../components/Tooltip";
import { ClassSpec, ClassNodeSpec } from "@/features/classes/ClassTypes";
import { ClassNode } from "../components/ClassNode";

export class CharacterScreen extends BaseScreen {
	readonly screenName = "character";

	private pointsEl!: HTMLElement;
	private wrapperEl!: HTMLElement;
	private treeEl!: HTMLElement;
	private zoomIndicatorEl!: HTMLElement;

	// Node tracking
	private nodeMap = new Map<string, HTMLElement>();
	private lineMap = new Map<string, SVGLineElement>();

	// Pan and zoom state
	private panX = 0;
	private panY = 0;
	private zoom = 1;
	private minZoom = 0.5;
	private maxZoom = 1.5;
	private maxPanDistance = 1500; // Maximum pan distance from origin
	private zoomTimeout: number | null = null;

	init() {
		this.addMarkuptoPage(Markup);

		// Cache elements
		this.pointsEl = this.byId("class-points");
		this.wrapperEl = this.byId("class-tree-scroll");
		this.treeEl = this.byId("class-tree");
		this.zoomIndicatorEl = this.byId("zoom-indicator");

		// Build the tree
		this.buildTree();
		this.updateUI();

		// Setup events
		this.setupPanning();
		this.setupEventListeners();
	}

	private setupEventListeners() {
		// Listen for class system changes
		bus.on("classes:pointsChanged", () => this.updateUI());
		bus.on("classes:nodesChanged", () => this.updateUI());
	}

	private updateUI() {
		this.updatePoints();
		this.updateNodeStates();
		this.updateLines();
	}

	private updatePoints() {
		const mgr = this.context.classes;
		const available = mgr.getAvailablePoints();
		const spent = mgr.getSpentPoints();
		this.pointsEl.textContent = `Class Points: ${available} available (${spent} spent)`;
	}

	private buildTree() {
		const specs = this.context.classes.getClassSpecs();
		this.treeEl.innerHTML = "";
		this.nodeMap.clear();
		this.lineMap.clear();

		// Layout constants
		const NODE_SIZE = 60;
		const NODE_SPACING_X = 100;
		const NODE_SPACING_Y = 120;
		const COLUMN_WIDTH = 450; // Increased from 300 to add more space between columns
		const START_X = 50; // Reduced from 100
		const START_Y = 50;

		// Create columns for each class
		specs.forEach((spec, specIndex) => {
			const column = document.createElement("div");
			column.className = "class-column";
			column.style.left = `${START_X + specIndex * COLUMN_WIDTH}px`;
			column.style.top = `${START_Y}px`;
			column.dataset.classId = spec.id;

			// Class icon
			const icon = document.createElement("img");
			icon.src = spec.iconUrl;
			icon.className = "class-icon";
			column.appendChild(icon);

			// Class title
			const title = document.createElement("div");
			title.className = "class-title";
			title.textContent = spec.name;
			column.appendChild(title);

			// Background panel
			const bg = document.createElement("div");
			bg.className = "class-bg";
			column.appendChild(bg);

			// SVG for lines - must be sized properly
			const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			svg.classList.add("class-lines");
			// No need to set explicit size - CSS handles it
			column.appendChild(svg);

			// Container for nodes
			const nodesContainer = document.createElement("div");
			nodesContainer.className = "class-nodes";
			column.appendChild(nodesContainer);

			// Create nodes
			spec.nodes.forEach((node) => {
				const nodeEl = this.createNode(spec, node);
				// Position based on grid
				nodeEl.style.left = `${node.col * NODE_SPACING_X}px`;
				nodeEl.style.top = `${node.row * NODE_SPACING_Y}px`;

				nodesContainer.appendChild(nodeEl);
				this.nodeMap.set(`${spec.id}:${node.id}`, nodeEl);
			});

			this.treeEl.appendChild(column);
		});

		// Create connection lines after DOM is ready
		requestAnimationFrame(() => {
			this.createConnectionLines(specs);
			this.updateLines(); // Update line states
			this.updateUI();
		});
	}

	private createNode(spec: ClassSpec, node: ClassNodeSpec): HTMLElement {
		const nodeEl = new ClassNode(spec, node, (classId: string, nodeId: string) => {
			this.handleNodeClick(classId, nodeId);
		});
		return nodeEl.getEl();
	}

	private createConnectionLines(specs: ClassSpec[]) {
		specs.forEach((spec) => {
			const column = this.treeEl.querySelector<HTMLElement>(`.class-column[data-class-id="${spec.id}"]`);
			if (!column) return;

			const svg = column.querySelector<SVGSVGElement>(".class-lines");
			if (!svg) return;

			spec.nodes.forEach((node) => {
				if (!node.prereq) return;

				const fromEl = this.nodeMap.get(`${spec.id}:${node.prereq}`);
				const toEl = this.nodeMap.get(`${spec.id}:${node.id}`);
				if (!fromEl || !toEl) return;

				// Get positions relative to the SVG container
				// Nodes are in .class-nodes which has relative positioning
				const x1 = parseInt(fromEl.style.left) + 30; // Node center
				const y1 = parseInt(fromEl.style.top) + 60; // Node bottom
				const x2 = parseInt(toEl.style.left) + 30; // Node center
				const y2 = parseInt(toEl.style.top); // Node top

				// Adjust for nodes container padding (2rem = 32px)
				const offsetX1 = x1 + 48;
				const offsetY1 = y1 + 48;
				const offsetX2 = x2 + 48;
				const offsetY2 = y2 + 48;

				const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
				line.setAttribute("x1", offsetX1.toString());
				line.setAttribute("y1", offsetY1.toString());
				line.setAttribute("x2", offsetX2.toString());
				line.setAttribute("y2", offsetY2.toString());
				line.classList.add("link-line");

				svg.appendChild(line);
				this.lineMap.set(`${spec.id}:${node.id}`, line);
			});
		});
	}

	private handleNodeClick(classId: string, nodeId: string) {
		const success = this.context.classes.allocatePoint(classId, nodeId);
		if (!success) {
			// Could add visual feedback for failed allocation
			console.log("Cannot allocate point to this node");
		}
	}

	private updateNodeStates() {
		const mgr = this.context.classes;

		for (const [key, el] of this.nodeMap) {
			const [classId, nodeId] = key.split(":");
			const spec = mgr.getClassSpecs().find((s) => s.id === classId);
			const node = spec?.nodes.find((n) => n.id === nodeId);
			if (!spec || !node) continue;

			const points = mgr.getNodePoints(classId, nodeId);
			const levelEl = el.querySelector<HTMLElement>(".node-level")!;
			levelEl.textContent = `${points}/${node.maxPoints}`;

			// Update visual states
			el.classList.toggle("maxed", points >= node.maxPoints);
			el.classList.toggle("partial", points > 0 && points < node.maxPoints);

			// Check if node can be purchased
			const canPurchase = this.canPurchaseNode(classId, node);
			el.classList.toggle("locked", !canPurchase && points === 0);
		}
	}

	private canPurchaseNode(classId: string, node: ClassNodeSpec): boolean {
		const mgr = this.context.classes;

		// Check if we have enough points
		if (mgr.getAvailablePoints() < node.cost) return false;

		// Check if already maxed
		const current = mgr.getNodePoints(classId, node.id);
		if (current >= node.maxPoints) return false;

		// Check prerequisite
		if (node.prereq) {
			const prereqPoints = mgr.getNodePoints(classId, node.prereq);
			if (prereqPoints === 0) return false;
		}

		return true;
	}

	private updateLines() {
		const mgr = this.context.classes;

		for (const [key, line] of this.lineMap) {
			const [classId, nodeId] = key.split(":");
			const spec = mgr.getClassSpecs().find((s) => s.id === classId);
			const node = spec?.nodes.find((n) => n.id === nodeId);
			if (!node?.prereq) continue;

			const fromPoints = mgr.getNodePoints(classId, node.prereq);
			const toPoints = mgr.getNodePoints(classId, nodeId);

			// Line is active if both nodes have points
			line.classList.toggle("active", fromPoints > 0 && toPoints > 0);
		}
	}

	private setupPanning() {
		let isDragging = false;
		let startX = 0;
		let startY = 0;
		let startPanX = 0;
		let startPanY = 0;

		// Mouse wheel zoom
		this.wrapperEl.addEventListener("wheel", (e) => {
			e.preventDefault();

			const delta = e.deltaY > 0 ? 0.9 : 1.1;
			const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * delta));

			if (newZoom !== this.zoom) {
				this.zoom = newZoom;
				this.applyTreePosition();
			}
		});

		this.wrapperEl.addEventListener("mousedown", (e) => {
			// Don't start drag if clicking on a node
			if ((e.target as HTMLElement).classList.contains("class-node")) return;

			isDragging = true;
			startX = e.clientX;
			startY = e.clientY;
			startPanX = this.panX;
			startPanY = this.panY;
			this.wrapperEl.classList.add("dragging");
		});

		window.addEventListener("mousemove", (e) => {
			if (!isDragging) return;

			const dx = e.clientX - startX;
			const dy = e.clientY - startY;

			// Apply pan with limits
			let newPanX = startPanX + dx;
			let newPanY = startPanY + dy;

			// Limit pan distance
			const distance = Math.sqrt(newPanX * newPanX + newPanY * newPanY);
			if (distance > this.maxPanDistance) {
				const scale = this.maxPanDistance / distance;
				newPanX *= scale;
				newPanY *= scale;
			}

			this.panX = newPanX;
			this.panY = newPanY;

			this.applyTreePosition();
		});

		window.addEventListener("mouseup", () => {
			if (isDragging) {
				isDragging = false;
				this.wrapperEl.classList.remove("dragging");
			}
		});

		// Touch support for mobile
		let touchStartX = 0;
		let touchStartY = 0;
		let initialPinchDistance = 0;
		let isPinching = false;

		this.wrapperEl.addEventListener("touchstart", (e) => {
			if (e.touches.length === 2) {
				// Pinch zoom
				isPinching = true;
				const dx = e.touches[0].clientX - e.touches[1].clientX;
				const dy = e.touches[0].clientY - e.touches[1].clientY;
				initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
			} else if (e.touches.length === 1 && !isPinching) {
				// Pan
				if ((e.target as HTMLElement).classList.contains("class-node")) return;

				const touch = e.touches[0];
				isDragging = true;
				touchStartX = touch.clientX;
				touchStartY = touch.clientY;
				startPanX = this.panX;
				startPanY = this.panY;
			}
		});

		this.wrapperEl.addEventListener("touchmove", (e) => {
			e.preventDefault();

			if (e.touches.length === 2 && isPinching) {
				// Handle pinch zoom
				const dx = e.touches[0].clientX - e.touches[1].clientX;
				const dy = e.touches[0].clientY - e.touches[1].clientY;
				const distance = Math.sqrt(dx * dx + dy * dy);
				const scale = distance / initialPinchDistance;

				// Apply scale incrementally
				const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * (1 + (scale - 1) * 0.02)));
				if (Math.abs(newZoom - this.zoom) > 0.01) {
					this.zoom = newZoom;
					this.applyTreePosition();
				}
			} else if (e.touches.length === 1 && isDragging && !isPinching) {
				// Handle pan
				const touch = e.touches[0];
				const dx = touch.clientX - touchStartX;
				const dy = touch.clientY - touchStartY;

				// Apply pan with limits
				let newPanX = startPanX + dx;
				let newPanY = startPanY + dy;

				const distance = Math.sqrt(newPanX * newPanX + newPanY * newPanY);
				if (distance > this.maxPanDistance) {
					const scale = this.maxPanDistance / distance;
					newPanX *= scale;
					newPanY *= scale;
				}

				this.panX = newPanX;
				this.panY = newPanY;

				this.applyTreePosition();
			}
		});

		this.wrapperEl.addEventListener("touchend", () => {
			isDragging = false;
			isPinching = false;
		});
	}

	private applyTreePosition() {
		this.treeEl.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
		this.treeEl.style.transformOrigin = "center center";

		// Scale grid pattern with zoom
		const gridSize = 30 / this.zoom;
		this.treeEl.style.backgroundSize = `${gridSize}px ${gridSize}px`;

		// Update zoom indicator
		this.zoomIndicatorEl.textContent = `${Math.round(this.zoom * 100)}%`;
		this.zoomIndicatorEl.classList.add("active");

		// Hide indicator after a delay
		if (this.zoomTimeout) clearTimeout(this.zoomTimeout);
		this.zoomTimeout = window.setTimeout(() => {
			this.zoomIndicatorEl.classList.remove("active");
		}, 1500);
	}

	show() {
		// Update UI when screen is shown
		this.updateUI();
	}

	hide() {
		// Clean up if needed
		if (this.zoomTimeout) {
			clearTimeout(this.zoomTimeout);
			this.zoomTimeout = null;
		}
	}

	// Cleanup on screen destroy
	destroy() {
		if (this.zoomTimeout) {
			clearTimeout(this.zoomTimeout);
		}
		super.destroy();
	}
}
