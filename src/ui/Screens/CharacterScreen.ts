import { BaseScreen } from "./BaseScreen";
import Markup from "./character.html?raw";
import { bus } from "@/core/EventBus";
import { Tooltip } from "../components/Tooltip";
import { ClassSpec, ClassNodeSpec } from "@/features/classes/ClassTypes";

export class CharacterScreen extends BaseScreen {
    readonly screenName = "character";

    private pointsEl!: HTMLElement;
    private scrollEl!: HTMLElement;
    private treeEl!: HTMLElement;
    private nodeMap = new Map<string, HTMLElement>();
    private lineMap = new Map<string, SVGLineElement>();

    init() {
        this.addMarkuptoPage(Markup);
        this.pointsEl = this.byId("class-points");
        this.scrollEl = this.byId("class-tree-scroll");
        this.treeEl = this.byId("class-tree");
        this.buildTree();
        this.updatePoints();
        bus.on("classes:pointsChanged", () => {
            this.updatePoints();
            this.updateNodeStates();
            this.updateLines();
        });
        bus.on("classes:nodesChanged", () => {
            this.updatePoints();
            this.updateNodeStates();
            this.updateLines();
        });
        this.setupDragScroll();
    }
    show() {}
    hide() {}
    bindEvents() {}

    private updatePoints() {
        const mgr = this.context.classes;
        const available = mgr.getAvailablePoints();
        const spent = mgr.getSpentPoints();
        this.pointsEl.textContent = `Points: ${available} (spent ${spent})`;
    }

    private buildTree() {
        const specs = this.context.classes.getClassSpecs();
        this.treeEl.innerHTML = "";
        this.nodeMap.clear();
        this.lineMap.clear();

        const NODE_SIZE = 48;
        const COL_WIDTH = 280;
        const ROW_HEIGHT = 90;
        const COL_GAP = 40;

        let colIndex = 0;
        for (const spec of specs) {
            const column = document.createElement("div");
            column.className = "class-column";
            column.style.left = `${colIndex * (COL_WIDTH + COL_GAP)}px`;
            column.style.width = `${COL_WIDTH}px`;
            column.dataset.classId = spec.id;

            const bg = document.createElement("div");
            bg.className = "class-bg";
            column.appendChild(bg);

            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.classList.add("class-lines");
            column.appendChild(svg);

            const nodesContainer = document.createElement("div");
            nodesContainer.className = "class-nodes";
            column.appendChild(nodesContainer);

            spec.nodes.forEach((n) => {
                const el = this.createNodeElement(spec, n);
                el.style.left = `${n.col * (NODE_SIZE + 40)}px`;
                el.style.top = `${n.row * ROW_HEIGHT}px`;
                nodesContainer.appendChild(el);
                this.nodeMap.set(`${spec.id}:${n.id}`, el);
            });

            this.treeEl.appendChild(column);
            colIndex++;
        }

        // lines
        for (const spec of specs) {
            const svg = this.treeEl.querySelector<SVGSVGElement>(
                `.class-column[data-class-id="${spec.id}"] .class-lines`
            )!;
            spec.nodes.forEach((n) => {
                if (!n.prereq) return;
                const fromEl = this.nodeMap.get(`${spec.id}:${n.prereq}`)!;
                const toEl = this.nodeMap.get(`${spec.id}:${n.id}`)!;
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                const x1 = fromEl.offsetLeft + NODE_SIZE / 2;
                const y1 = fromEl.offsetTop + NODE_SIZE;
                const x2 = toEl.offsetLeft + NODE_SIZE / 2;
                const y2 = toEl.offsetTop;
                line.setAttribute("x1", `${x1}`);
                line.setAttribute("y1", `${y1}`);
                line.setAttribute("x2", `${x2}`);
                line.setAttribute("y2", `${y2}`);
                line.classList.add("link-line");
                svg.appendChild(line);
                this.lineMap.set(`${spec.id}:${n.id}`, line);
            });
        }

        this.updateNodeStates();
        this.updateLines();
    }

    private createNodeElement(spec: ClassSpec, node: ClassNodeSpec): HTMLElement {
        const el = document.createElement("div");
        el.className = "class-node";
        el.dataset.classId = spec.id;
        el.dataset.nodeId = node.id;
        el.innerHTML = `
            <span class="node-cost">${node.cost}</span>
            <div class="node-icon"></div>
            <span class="node-level">0/${node.maxPoints}</span>`;
        el.addEventListener("click", () => this.handleNodeClick(spec.id, node.id));
        el.addEventListener("mouseenter", () =>
            Tooltip.instance.show(el, {
                icon: "",
                name: node.name,
                description: "",
            })
        );
        el.addEventListener("mouseleave", () => Tooltip.instance.hide());
        return el;
    }

    private handleNodeClick(classId: string, nodeId: string) {
        this.context.classes.allocatePoint(classId, nodeId);
    }

    private updateNodeStates() {
        const mgr = this.context.classes;
        for (const [key, el] of this.nodeMap) {
            const [cid, nid] = key.split(":");
            const spec = mgr.getClassSpecs().find((c) => c.id === cid)!;
            const node = spec.nodes.find((n) => n.id === nid)!;
            const pts = mgr.getNodePoints(cid, nid);
            const levelEl = el.querySelector<HTMLElement>(".node-level")!;
            levelEl.textContent = `${pts}/${node.maxPoints}`;

            el.classList.toggle("maxed", pts >= node.maxPoints);
            el.classList.toggle("partial", pts > 0 && pts < node.maxPoints);

            const prereqMet = node.prereq ? mgr.getNodePoints(cid, node.prereq) > 0 : true;
            const accessible = prereqMet && mgr.getAvailablePoints() >= node.cost;
            el.classList.toggle("locked", !accessible && pts === 0);
        }
    }

    private updateLines() {
        const mgr = this.context.classes;
        for (const [key, line] of this.lineMap) {
            const [cid, nid] = key.split(":");
            const node = mgr
                .getClassSpecs()
                .find((c) => c.id === cid)!
                .nodes.find((n) => n.id === nid)!;
            const fromPts = mgr.getNodePoints(cid, node.prereq!);
            const toPts = mgr.getNodePoints(cid, nid);
            line.classList.toggle("active", fromPts > 0 && toPts > 0);
        }
    }

    private setupDragScroll() {
        let isDown = false;
        let startX = 0;
        let startY = 0;
        let scrollLeft = 0;
        let scrollTop = 0;
        const el = this.scrollEl;
        el.addEventListener("mousedown", (e) => {
            isDown = true;
            startX = e.clientX;
            startY = e.clientY;
            scrollLeft = el.scrollLeft;
            scrollTop = el.scrollTop;
            el.classList.add("dragging");
        });
        window.addEventListener("mouseup", () => {
            if (isDown) {
                isDown = false;
                el.classList.remove("dragging");
            }
        });
        window.addEventListener("mousemove", (e) => {
            if (!isDown) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            el.scrollLeft = scrollLeft - dx;
            el.scrollTop = scrollTop - dy;
        });
    }
}
