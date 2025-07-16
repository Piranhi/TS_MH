import { UIBase } from "./UIBase";

export interface TableDisplayOptions {
	container: HTMLElement;
	columns: number;
	headers?: string[];
	banded?: boolean;
	boldFirstColumn?: boolean;
	collapsible?: boolean;
	className?: string;
	title?: string;
	icon?: string;
}

export class TableDisplay extends UIBase {
	private wrapper!: HTMLElement;
	private table!: HTMLTableElement;
	private tbody!: HTMLTableSectionElement;
	private toggleBtn?: HTMLButtonElement;
	private isCollapsed: boolean = false;

	constructor(private options: TableDisplayOptions) {
		super();
		this.build();
	}

	private build() {
		// Create glass wrapper
		this.wrapper = document.createElement("div");
		this.wrapper.className = "glass-table-wrapper";
		if (this.options.className) {
			this.wrapper.classList.add(this.options.className);
		}

		// Add collapsible header if needed
		if (this.options.collapsible && (this.options.title || this.options.headers)) {
			const header = document.createElement("div");
			header.className = "glass-table-header";

			const titleContainer = document.createElement("div");
			titleContainer.className = "glass-table-title";

			if (this.options.icon) {
				const icon = document.createElement("span");
				icon.className = "glass-table-icon";
				icon.textContent = this.options.icon;
				titleContainer.appendChild(icon);
			}

			const titleText = document.createElement("span");
			titleText.textContent = this.options.title || (this.options.headers ? this.options.headers.join(" / ") : "Table");
			titleContainer.appendChild(titleText);

			header.appendChild(titleContainer);

			// Toggle button
			this.toggleBtn = document.createElement("button");
			this.toggleBtn.className = "glass-table-toggle";
			this.toggleBtn.innerHTML = "▼";
			this.toggleBtn.addEventListener("click", () => this.toggle());
			header.appendChild(this.toggleBtn);

			this.wrapper.appendChild(header);
		}

		// Create table container
		const tableContainer = document.createElement("div");
		tableContainer.className = "glass-table-container";

		// Create table
		this.table = document.createElement("table");
		this.table.className = "glass-table";

		// Add banded rows
		if (this.options.banded) {
			this.table.classList.add("glass-table--banded");
		}

		// Add bold first column
		if (this.options.boldFirstColumn) {
			this.table.classList.add("glass-table--first-col-bold");
		}

		// Create header if provided
		if (this.options.headers && this.options.headers.length > 0) {
			const thead = document.createElement("thead");
			const headerRow = document.createElement("tr");

			this.options.headers.forEach((header, index) => {
				const th = document.createElement("th");
				th.textContent = header;

				// Add sorting indicator for sortable columns
				if (index > 0) {
					// Usually first column is labels
					th.className = "sortable";
					const sortIcon = document.createElement("span");
					sortIcon.className = "sort-icon";
					sortIcon.textContent = "↕";
					th.appendChild(sortIcon);
				}

				headerRow.appendChild(th);
			});

			thead.appendChild(headerRow);
			this.table.appendChild(thead);
		}

		// Create tbody
		this.tbody = document.createElement("tbody");
		this.table.appendChild(this.tbody);

		// Append to container
		tableContainer.appendChild(this.table);
		this.wrapper.appendChild(tableContainer);
		this.options.container.appendChild(this.wrapper);

		// Store reference
		this.element = this.wrapper;
	}

	/**
	 * Update table data efficiently
	 */
	public updateData(rows: (string | number)[][]) {
		// Clear existing rows
		this.tbody.innerHTML = "";

		// Add new rows
		rows.forEach((rowData, rowIndex) => {
			const tr = document.createElement("tr");

			rowData.forEach((cellData, colIndex) => {
				const td = document.createElement("td");

				// Handle HTML content
				if (typeof cellData === "string" && cellData.includes("<")) {
					td.innerHTML = cellData;
				} else {
					td.textContent = String(cellData);
				}

				// Style first column if needed
				if (colIndex === 0 && this.options.boldFirstColumn) {
					td.className = "glass-table-label";
				}

				// Add data attributes for sorting/filtering
				td.setAttribute("data-value", String(cellData));

				tr.appendChild(td);
			});

			// Add row animation
			tr.style.opacity = "0";
			tr.style.transform = "translateX(-10px)";
			this.tbody.appendChild(tr);

			// Animate in
			requestAnimationFrame(() => {
				tr.style.transition = `opacity 0.3s ease ${rowIndex * 0.05}s, transform 0.3s ease ${rowIndex * 0.05}s`;
				tr.style.opacity = "1";
				tr.style.transform = "translateX(0)";
			});
		});
	}

	/**
	 * Add a single row with animation
	 */
	public addRow(rowData: (string | number)[]) {
		const tr = document.createElement("tr");

		rowData.forEach((cellData, colIndex) => {
			const td = document.createElement("td");
			td.textContent = String(cellData);

			if (colIndex === 0 && this.options.boldFirstColumn) {
				td.className = "glass-table-label";
			}

			tr.appendChild(td);
		});

		// Animate in
		tr.style.opacity = "0";
		tr.style.transform = "translateY(10px)";
		this.tbody.appendChild(tr);

		requestAnimationFrame(() => {
			tr.style.transition = "opacity 0.3s ease, transform 0.3s ease";
			tr.style.opacity = "1";
			tr.style.transform = "translateY(0)";
		});
	}

	/**
	 * Update a specific cell
	 */
	public updateCell(row: number, col: number, value: string | number) {
		const tr = this.tbody.children[row] as HTMLTableRowElement;
		if (tr && tr.children[col]) {
			const td = tr.children[col] as HTMLTableCellElement;
			const oldValue = td.textContent;
			td.textContent = String(value);

			// Highlight change animation
			if (oldValue !== String(value)) {
				td.style.background = "rgba(102, 126, 234, 0.2)";
				td.style.transition = "background 0.5s ease";

				setTimeout(() => {
					td.style.background = "";
				}, 500);
			}
		}
	}

	/**
	 * Toggle table visibility
	 */
	private toggle() {
		this.isCollapsed = !this.isCollapsed;
		const container = this.wrapper.querySelector(".glass-table-container") as HTMLElement;

		if (this.isCollapsed) {
			container.style.maxHeight = "0";
			container.style.opacity = "0";
			container.style.overflow = "hidden";
			container.style.transition = "max-height 0.3s ease, opacity 0.3s ease";
			if (this.toggleBtn) this.toggleBtn.innerHTML = "▶";
		} else {
			container.style.maxHeight = "1000px";
			container.style.opacity = "1";
			setTimeout(() => {
				container.style.maxHeight = "";
				container.style.overflow = "";
			}, 300);
			if (this.toggleBtn) this.toggleBtn.innerHTML = "▼";
		}
	}

	/**
	 * Clear all data
	 */
	public clear() {
		this.tbody.innerHTML = "";
	}

	/**
	 * Destroy the table
	 */
	public destroy() {
		super.destroy();
		this.wrapper.remove();
	}
}
