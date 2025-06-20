import { ClassNodeSpec, ClassSpec } from "@/features/classes/ClassTypes";
import { Tooltip } from "./Tooltip";
import { UIBase } from "./UIBase";

export class ClassNode extends UIBase {
	constructor(
		private readonly spec: ClassSpec,
		private readonly node: ClassNodeSpec,
		private readonly onNodeClick?: (classId: string, nodeId: string) => void
	) {
		super();
		this.build();
	}

	public getEl(): HTMLElement {
		return this.element;
	}

	private build() {
		const el = document.createElement("div");
		this.element = el;
		el.className = "class-node";
		el.dataset.classId = this.spec.id;
		el.dataset.nodeId = this.node.id;

		// Cost label
		const cost = document.createElement("span");
		cost.className = "node-cost";
		cost.textContent = `${this.node.cost}pt`;
		el.appendChild(cost);

		// Icon (you can customize this based on node type)
		const icon = document.createElement("div");
		icon.className = "node-icon";
		//icon.textContent = this.getNodeIcon(this.node);
		el.appendChild(icon);

		// Level indicator
		const level = document.createElement("span");
		level.className = "node-level";
		level.textContent = `0/${this.node.maxPoints}`;
		el.appendChild(level);

		// Click handler
		el.addEventListener("click", (e) => {
			e.stopPropagation();
			if (this.onNodeClick) {
				this.onNodeClick(this.spec.id, this.node.id);
			}
		});

		// Tooltip
		el.addEventListener("mouseenter", () => {
			Tooltip.instance.show(el, {
				icon: this.getNodeIcon(),
				name: this.node.name,
				description: this.node.description,
			});
		});

		el.addEventListener("mouseleave", () => Tooltip.instance.hide());

		//return el;
	}

	private getNodeIcon() {
		return this.node.iconUrl;
	}
}
