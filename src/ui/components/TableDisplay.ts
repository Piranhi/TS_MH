import { UIBase } from "./UIBase";

export interface TableDisplayOptions {
    /** Parent element where the table will be appended */
    container: HTMLElement;
    /** Array of header labels. If omitted, no <thead> is rendered */
    headers?: string[];
    /** Number of columns in each row */
    columns: number;
    /** Alternate row background colours */
    banded?: boolean;
    /** Bold text for the first column */
    boldFirstColumn?: boolean;
    /** Can the table body be collapsed/expanded */
    collapsible?: boolean;
    /** Optional colour theme */
    color?: "red" | "green" | "blue" | "yellow" | "purple";
}

/** Lightweight table component for displaying tabular data */
export class TableDisplay extends UIBase {
    private table!: HTMLTableElement;
    private tbody!: HTMLTableSectionElement;
    private toggleBtn?: HTMLButtonElement;
    private data: (string | number)[][] = [];
    private collapsed = false;

    constructor(private options: TableDisplayOptions) {
        super();
        this.build();
    }

    /** Build the DOM structure */
    private build() {
        const wrapper = document.createElement("div");
        wrapper.classList.add("basic-table-wrapper");

        this.table = document.createElement("table");
        this.table.classList.add("basic-table");

        if (this.options.banded) this.table.classList.add("basic-table--banded");
        if (this.options.boldFirstColumn) {
            this.table.classList.add("basic-table--first-col-bold");
        }
        if (this.options.color) {
            this.table.classList.add(`basic-table--${this.options.color}`);
        }

        if (this.options.headers && this.options.headers.length > 0) {
            const thead = document.createElement("thead");
            const tr = document.createElement("tr");
            this.options.headers.forEach((h) => {
                const th = document.createElement("th");
                th.textContent = h;
                tr.appendChild(th);
            });
            thead.appendChild(tr);
            this.table.appendChild(thead);
        }

        this.tbody = document.createElement("tbody");
        this.table.appendChild(this.tbody);

        wrapper.appendChild(this.table);
        this.element = wrapper;
        this.options.container.appendChild(wrapper);

        if (this.options.collapsible) {
            this.toggleBtn = document.createElement("button");
            this.toggleBtn.className = "table-toggle-btn";
            this.toggleBtn.textContent = "-";
            wrapper.prepend(this.toggleBtn);
            this.bindDomEvent(this.toggleBtn, "click", () => this.toggleCollapse());
        }
    }

    /** Populate the table body with data rows */
    private renderData() {
        this.tbody.innerHTML = "";
        this.data.forEach((row) => {
            const tr = document.createElement("tr");
            for (let i = 0; i < this.options.columns; i++) {
                const td = document.createElement("td");
                const value = row[i];
                td.textContent = value !== undefined ? String(value) : "";
                tr.appendChild(td);
            }
            this.tbody.appendChild(tr);
        });
    }

    /** Replace all rows and re-render */
    public setRows(rows: (string | number)[][]) {
        this.data = rows;
        this.renderData();
    }

    /** Update a single row by index */
    public updateRow(index: number, row: (string | number)[]) {
        this.data[index] = row;
        this.renderData();
    }

    /** Toggle the collapsed state */
    public toggleCollapse() {
        if (!this.options.collapsible) return;
        this.collapsed = !this.collapsed;
        this.table.style.display = this.collapsed ? "none" : "";
        if (this.toggleBtn) {
            this.toggleBtn.textContent = this.collapsed ? "+" : "-";
        }
    }

    /** Update options and optionally re-render */
    public updateOptions(opts: Partial<TableDisplayOptions>) {
        this.options = { ...this.options, ...opts };

        // Update class modifiers
        if (opts.banded !== undefined) {
            this.table.classList.toggle("basic-table--banded", !!this.options.banded);
        }
        if (opts.boldFirstColumn !== undefined) {
            this.table.classList.toggle(
                "basic-table--first-col-bold",
                !!this.options.boldFirstColumn
            );
        }
        if (opts.color !== undefined) {
            this.table.classList.remove(
                "basic-table--red",
                "basic-table--green",
                "basic-table--blue",
                "basic-table--yellow",
                "basic-table--purple"
            );
            if (this.options.color) {
                this.table.classList.add(`basic-table--${this.options.color}`);
            }
        }
        if (opts.headers) {
            // Rebuild header
            const existing = this.table.querySelector("thead");
            if (existing) existing.remove();
            if (this.options.headers && this.options.headers.length > 0) {
                const thead = document.createElement("thead");
                const tr = document.createElement("tr");
                this.options.headers.forEach((h) => {
                    const th = document.createElement("th");
                    th.textContent = h;
                    tr.appendChild(th);
                });
                thead.appendChild(tr);
                this.table.prepend(thead);
            }
        }
        this.renderData();
    }
}

