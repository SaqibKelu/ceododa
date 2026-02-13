/* =========================================================
   whoswho.js  –  Who's Who Directory
   Chief Education Officer, Doda
   ========================================================= */

"use strict";

/* ── State ─────────────────────────────────────────────────── */
let allStaff      = [];
let filteredStaff = [];
let currentPage   = 1;

/* ── DOM refs ──────────────────────────────────────────────── */
const grid           = document.getElementById("whoGrid");
const searchInput    = document.getElementById("whoSearch");
const pageSizeSelect = document.getElementById("whoPageSize");
const infoBox        = document.getElementById("whoInfo");
const paginationBox  = document.getElementById("whoPagination");

/* ── Helpers ───────────────────────────────────────────────── */
function getPageSize() {
  return Math.max(1, parseInt(pageSizeSelect.value, 10) || 12);
}

function sanitize(str) {
  const d = document.createElement("div");
  d.textContent = str || "";
  return d.innerHTML;
}

function photoSrc(filename) {
  if (!filename || !filename.trim()) return "assets/staff-images/default.png";
  return "assets/staff-images/" + encodeURIComponent(filename.trim());
}

/* ── Section filter population ─────────────────────────────── */
function buildSectionFilter() {
  const sectionSelect = document.getElementById("whoSection");
  if (!sectionSelect) return;

  const sections = [...new Set(
    allStaff.map(p => (p.section || "").trim()).filter(Boolean)
  )].sort();

  sections.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    sectionSelect.appendChild(opt);
  });

  sectionSelect.addEventListener("change", () => {
    currentPage = 1;
    applyFilter();
  });
}

/* ── Filter ────────────────────────────────────────────────── */
function applyFilter() {
  const q       = searchInput.value.toLowerCase().trim();
  const secEl   = document.getElementById("whoSection");
  const section = secEl ? secEl.value : "";

  filteredStaff = allStaff.filter(p => {
    if (section && (p.section || "").trim() !== section) return false;
    if (q) {
      const hay = [p.name, p.designation, p.section, p.email, p.contact]
        .filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    }
    return true;
  });

  currentPage = 1;
  render();
}

/* ── Build one card ────────────────────────────────────────── */
function buildCard(p, index) {
  const photo   = photoSrc(p.photo);
  const name    = sanitize(p.name        || "—");
  const desig   = sanitize(p.designation || "—");
  const section = sanitize(p.section     || "—");
  const contact = sanitize(p.contact     || "");
  const email   = sanitize(p.email       || "");

  const telHTML = p.contact
    ? `<a href="tel:${p.contact.replace(/\D/g,"")}" class="staff-contact-row">
         <i class="bi bi-telephone-fill"></i><span>${contact}</span>
       </a>`
    : `<span class="staff-contact-row"><i class="bi bi-telephone"></i><span>—</span></span>`;

  const mailHTML = p.email
    ? `<a href="mailto:${sanitize(p.email)}" class="staff-contact-row">
         <i class="bi bi-envelope-fill"></i><span>${email}</span>
       </a>`
    : `<span class="staff-contact-row"><i class="bi bi-envelope"></i><span>—</span></span>`;

  const col = document.createElement("div");
  col.className = "col-xl-3 col-lg-4 col-md-6";
  col.style.animationDelay = `${index * 40}ms`;

  col.innerHTML = `
    <div class="staff-card h-100">
      <div class="staff-photo-wrap">
        <img
          src="${photo}"
          alt="Photo of ${name}"
          class="staff-photo"
          loading="lazy"
          decoding="async"
          onerror="this.onerror=null;this.src='assets/staff-images/default.png';"
        >
        <div class="staff-section-overlay">${section}</div>
      </div>
      <div class="staff-body">
        <div class="staff-name">${name}</div>
        <div class="staff-designation">${desig}</div>
        <div class="staff-divider"></div>
        <div class="staff-contact">
          ${telHTML}
          ${mailHTML}
        </div>
      </div>
    </div>
  `;

  return col;
}

/* ── Render grid ───────────────────────────────────────────── */
function render() {
  const pageSize   = getPageSize();
  const total      = filteredStaff.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1)          currentPage = 1;

  const start     = (currentPage - 1) * pageSize;
  const end       = Math.min(start + pageSize, total);
  const pageItems = filteredStaff.slice(start, end);

  grid.innerHTML = "";

  if (total === 0) {
    const q = searchInput.value.trim();
    grid.innerHTML = `
      <div class="col-12">
        <div class="staff-empty">
          <i class="bi bi-person-x staff-empty-icon"></i>
          <div class="staff-empty-title">No staff found</div>
          <div class="staff-empty-sub">${
            q ? `No results for "<strong>${sanitize(q)}</strong>"` : "No staff in this section"
          }</div>
        </div>
      </div>`;
    infoBox.textContent = "Showing 0 of 0 staff";
    paginationBox.innerHTML = "";
    return;
  }

  pageItems.forEach((p, i) => grid.appendChild(buildCard(p, i)));

  infoBox.textContent = `Showing ${start + 1}–${end} of ${total} staff`;
  renderPagination(totalPages);
}

/* ── Pagination ────────────────────────────────────────────── */
function renderPagination(totalPages) {
  paginationBox.innerHTML = "";
  if (totalPages <= 1) return;

  const makeBtn = (label, page, active = false, disabled = false) => {
    const btn = document.createElement("button");
    btn.className = "staff-pg-btn" + (active ? " active" : "");
    btn.textContent = label;
    btn.disabled    = disabled;
    btn.setAttribute("aria-label", typeof label === "number" ? `Page ${label}` : String(label));
    if (active) btn.setAttribute("aria-current", "page");
    btn.addEventListener("click", () => {
      if (page !== currentPage) { currentPage = page; render(); }
    });
    return btn;
  };

  const makeEllipsis = () => {
    const s = document.createElement("span");
    s.className   = "staff-pg-ellipsis";
    s.textContent = "…";
    s.setAttribute("aria-hidden", "true");
    return s;
  };

  paginationBox.appendChild(makeBtn("‹ Prev", currentPage - 1, false, currentPage === 1));

  const AROUND = 2;
  for (let p = 1; p <= totalPages; p++) {
    const near = Math.abs(p - currentPage) <= AROUND;
    const edge = p === 1 || p === totalPages;
    if (near || edge) {
      paginationBox.appendChild(makeBtn(p, p, p === currentPage));
    } else if (
      (p === 2             && currentPage > AROUND + 2) ||
      (p === totalPages - 1 && currentPage < totalPages - AROUND - 1)
    ) {
      paginationBox.appendChild(makeEllipsis());
    }
  }

  paginationBox.appendChild(makeBtn("Next ›", currentPage + 1, false, currentPage === totalPages));
}

/* ── Load JSON ─────────────────────────────────────────────── */
fetch("assets/data/whoswho.json")
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then(data => {
    allStaff      = Array.isArray(data) ? data : [];
    filteredStaff = [...allStaff];
    buildSectionFilter();
    render();
  })
  .catch(err => {
    console.error("[Who's Who]", err);
    grid.innerHTML = `
      <div class="col-12">
        <div class="staff-empty">
          <i class="bi bi-exclamation-triangle staff-empty-icon" style="color:#dc2626"></i>
          <div class="staff-empty-title">Could not load staff directory</div>
          <div class="staff-empty-sub">Please refresh the page or contact the administrator.</div>
        </div>
      </div>`;
  });

/* ── Events ────────────────────────────────────────────────── */
searchInput.addEventListener("input", applyFilter);
pageSizeSelect.addEventListener("change", () => { currentPage = 1; render(); });