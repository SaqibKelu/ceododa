// =========================================
// Advanced DataTable Utility (Unified)
// Search + Page Size + Pagination
// Optional: Year/Month Filters (Dynamic from Data)
// =========================================

function initDataTable(wrapperId, options = {}) {
    const settings = {
        enableDateFilters: true,
        ...options
    };

    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;

    // Inject toolbar
    if (!wrapper.querySelector(".data-table-toolbar")) {
        const toolbar = document.createElement("div");
        toolbar.className = "data-table-toolbar";

        toolbar.innerHTML = `
            <div class="left-tools">
                <input type="text" class="dt-search" placeholder="Search...">
                ${settings.enableDateFilters ? `
                <select class="dt-year">
                    <option value="">All Years</option>
                </select>
                <select class="dt-month">
                    <option value="">All Months</option>
                    <option value="01">Jan</option>
                    <option value="02">Feb</option>
                    <option value="03">Mar</option>
                    <option value="04">Apr</option>
                    <option value="05">May</option>
                    <option value="06">Jun</option>
                    <option value="07">Jul</option>
                    <option value="08">Aug</option>
                    <option value="09">Sep</option>
                    <option value="10">Oct</option>
                    <option value="11">Nov</option>
                    <option value="12">Dec</option>
                </select>
                ` : ``}
            </div>
            <div class="right-tools">
                <select class="dt-pagesize">
                    <option value="5">5</option>
                    <option value="10" selected>10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                </select>
            </div>
        `;
        wrapper.prepend(toolbar);
    }

    // Footer
    if (!wrapper.querySelector(".data-table-footer")) {
        const footer = document.createElement("div");
        footer.className = "data-table-footer";
        footer.innerHTML = `<div class="dt-info"></div>`;
        wrapper.appendChild(footer);
    }

    // Pagination
    if (!wrapper.querySelector(".dt-pagination")) {
        const pag = document.createElement("div");
        pag.className = "d-flex justify-content-center mt-3 dt-pagination";
        wrapper.appendChild(pag);
    }

    const table = wrapper.querySelector("table");
    const tbody = table.querySelector("tbody");

    const searchInput = wrapper.querySelector(".dt-search");
    const yearSelect = wrapper.querySelector(".dt-year");
    const monthSelect = wrapper.querySelector(".dt-month");
    const pageSizeSelect = wrapper.querySelector(".dt-pagesize");
    const infoBox = wrapper.querySelector(".dt-info");
    const paginationBox = wrapper.querySelector(".dt-pagination");

    let allRows = [];
    let filteredRows = [];
    let currentPage = 1;

    function getPageSize() {
        return parseInt(pageSizeSelect.value, 10);
    }

    function scanRows() {
        allRows = Array.from(tbody.querySelectorAll("tr"));
        filteredRows = [...allRows];

        // Populate year dropdown dynamically from data
        if (settings.enableDateFilters && yearSelect) {
            yearSelect.innerHTML = `<option value="">All Years</option>` + generateYearOptionsFromRows(allRows);
        }
    }

    function applyFilters() {
        const search = searchInput.value.toLowerCase();
        const year = settings.enableDateFilters && yearSelect ? yearSelect.value : "";
        const month = settings.enableDateFilters && monthSelect ? monthSelect.value : "";

        filteredRows = allRows.filter(row => {
            const text = row.innerText.toLowerCase();
            const dateAttr = row.getAttribute("data-date"); // YYYY-MM-DD

            let show = true;

            if (search && !text.includes(search)) show = false;

            if (settings.enableDateFilters && dateAttr && (year || month)) {
                const d = new Date(dateAttr);

                if (year && d.getFullYear().toString() !== year) show = false;

                if (month) {
                    const m = (d.getMonth() + 1).toString().padStart(2, "0");
                    if (m !== month) show = false;
                }
            }

            return show;
        });

        currentPage = 1;
        renderTable();
    }

    function renderTable() {
        const pageSize = getPageSize();
        const totalRows = filteredRows.length;
        const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

        if (currentPage > totalPages) currentPage = totalPages;

        allRows.forEach(row => row.style.display = "none");

        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        const pageRows = filteredRows.slice(start, end);

        pageRows.forEach(row => row.style.display = "");

        if (totalRows === 0) {
            infoBox.textContent = "Showing 0 of 0 records";
        } else {
            const showingFrom = start + 1;
            const showingTo = Math.min(end, totalRows);
            infoBox.textContent = `Showing ${showingFrom}–${showingTo} of ${totalRows} records`;
        }

        renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
        paginationBox.innerHTML = "";
        if (totalPages <= 1) return;

        const createBtn = (label, page, disabled = false, active = false) => {
            const btn = document.createElement("button");
            btn.className = "btn btn-sm btn-outline-secondary mx-1";
            if (active) btn.classList.add("active");
            btn.textContent = label;
            btn.disabled = disabled;
            btn.addEventListener("click", () => {
                currentPage = page;
                renderTable();
            });
            return btn;
        };

        paginationBox.appendChild(createBtn("Prev", currentPage - 1, currentPage === 1));

        for (let p = 1; p <= totalPages; p++) {
            paginationBox.appendChild(createBtn(p, p, false, p === currentPage));
        }

        paginationBox.appendChild(createBtn("Next", currentPage + 1, currentPage === totalPages));
    }

    function bindEvents() {
        searchInput.addEventListener("input", applyFilters);
        if (settings.enableDateFilters && yearSelect) yearSelect.addEventListener("change", applyFilters);
        if (settings.enableDateFilters && monthSelect) monthSelect.addEventListener("change", applyFilters);
        pageSizeSelect.addEventListener("change", applyFilters);
    }

    // Initial bind
    bindEvents();

    // Public refresh hook (important for JSON-loaded tables)
    wrapper._dtRefresh = function () {
        scanRows();
        applyFilters();
    };

    // First scan (in case rows already exist)
    scanRows();
    renderTable();
}

// =========================================
// Generate Year Options from Table Rows
// =========================================
function generateYearOptionsFromRows(rows) {
    const years = new Set();

    rows.forEach(row => {
        const dateAttr = row.getAttribute("data-date"); // YYYY-MM-DD
        if (dateAttr) {
            const y = dateAttr.split("-")[0];
            if (parseInt(y, 10) >= 2024) {
                years.add(y);
            }
        }
    });

    const sortedYears = Array.from(years).sort((a, b) => b - a);

    let html = "";
    sortedYears.forEach(y => {
        html += `<option value="${y}">${y}</option>`;
    });

    return html;
}

// =========================================
// JSON → Table Loader (ALL TYPES)
// =========================================
async function loadJsonTable(config) {
    const { jsonPath, tableBodyId, type, resourcePath = "" } = config;

    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;

    try {
        const res = await fetch(jsonPath);
        if (!res.ok) throw new Error("Failed to load " + jsonPath);

        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted py-3">No records found</td></tr>`;
            return;
        }

        tbody.innerHTML = "";

        const basePath = resourcePath.endsWith("/") ? resourcePath : resourcePath + "/";

        data.forEach((item, index) => {
            const tr = document.createElement("tr");

            const title  = item.title || item.Title || "";
            const number = item.number || item.Number || "-";
            const date   = item.date || item.Date || "";
            let file     = item.file || item.Link || "";

            if (file && file.includes("/")) file = file.split("/").pop();

            if (date) {
                const [d, m, y] = date.split("-");
                tr.setAttribute("data-date", `${y}-${m}-${d}`);
            }

            if (type === "orders" || type === "notifications" || type === "circulars" || type === "press" || type === "seniority") {
                tr.innerHTML = `
                    <td data-label="S.No">${index + 1}</td>
                    <td data-label="Title">${title}</td>
                    <td data-label="Number">${number}</td>
                    <td data-label="Date">${date}</td>
                    <td data-label="View">
                        <a class="table-pdf-icon" href="${basePath}${file}" target="_blank" rel="noopener">
                            <i class="bi bi-file-earmark-pdf-fill"></i>
                        </a>
                    </td>
                `;
            }

            if (type === "downloads") {
                tr.innerHTML = `
                    <td data-label="S.No">${index + 1}</td>
                    <td data-label="Title">${title}</td>
                    <td data-label="View">
                        <a class="table-pdf-icon" href="${basePath}${file}" target="_blank" rel="noopener">
                            <i class="bi bi-file-earmark-pdf-fill"></i>
                        </a>
                    </td>
                `;
            }

            if (type === "whoswho") {
                tr.innerHTML = `
                    <td data-label="S.No">${index + 1}</td>
                    <td data-label="Name">${item.name || ""}</td>
                    <td data-label="Designation">${item.designation || ""}</td>
                    <td data-label="Section">${item.section || ""}</td>
                    <td data-label="Contact">${item.contact || ""}</td>
                    <td data-label="Email">${item.email || ""}</td>
                `;
            }

            tbody.appendChild(tr);
        });

        // Auto-refresh DataTable if present
        const wrapper = tbody.closest(".data-table-wrap");
        if (wrapper && wrapper._dtRefresh) {
            wrapper._dtRefresh();
        }

    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="10" class="text-center text-danger py-3">No Data to Display</td></tr>`;
    }
}