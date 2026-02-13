// =============================================
// assets/js/main.js
// Core JS for CEO Doda (Data-driven sections only)
// Uses JSON schema:
// { Title, Number, Date, Link }
// =============================================

// ───────────────────────────────────────────────
// Helper: Trim text at word boundary and add ellipsis
// ───────────────────────────────────────────────
function truncateTextByWords(text, maxLength = 80) {
    if (!text || text.length <= maxLength) return text;

    let trimmed = text.slice(0, maxLength);
    const lastSpace = trimmed.lastIndexOf(" ");
    if (lastSpace > 0) {
        trimmed = trimmed.slice(0, lastSpace);
    }
    return trimmed + "…";
}

// ───────────────────────────────────────────────
// Load News Ticker from JSON
// ───────────────────────────────────────────────
async function loadNewsTicker() {
    const track = document.getElementById('newsTickerTrack');
    if (!track) return;

    try {
        const response = await fetch('assets/data/news.json');
        if (!response.ok) throw new Error('Failed to load news.json');

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            track.innerHTML = `<div class="ticker-item">No announcements available.</div>`;
            return;
        }

        track.innerHTML = '';

        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'ticker-item';
            div.textContent = item.text || item.Text || '';
            track.appendChild(div);
        });

    } catch (error) {
        console.error('Error loading news ticker:', error);
        track.innerHTML = `<div class="ticker-item">Unable to load announcements.</div>`;
    }
}

// ───────────────────────────────────────────────
// Generic loader for Latest Updates (Top 5)
// Uses basePath like tables do
// ───────────────────────────────────────────────
async function loadLatestFive({ jsonPath, targetId, emptyMessage, basePath }) {
    const container = document.getElementById(targetId);
    if (!container) return;

    try {
        const response = await fetch(jsonPath);
        if (!response.ok) throw new Error(`Failed to load ${jsonPath}`);

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML = `<p class="text-center text-muted py-4">${emptyMessage}</p>`;
            return;
        }

        // Normalize records and fix link paths
        const normalized = data.map(item => {
            let link = item.Link || "#";

            // If link is only a filename, prefix with basePath
            if (link && !link.includes("/") && basePath) {
                const base = basePath.endsWith("/") ? basePath : basePath + "/";
                link = base + link;
            }

            return {
                title: item.Title || "",
                date:  item.Date  || "",
                link:  link,
                number: item.Number || ""
            };
        }).filter(item => item.title && item.date && item.link);

        if (normalized.length === 0) {
            container.innerHTML = `<p class="text-center text-muted py-4">${emptyMessage}</p>`;
            return;
        }

        // Sort by date descending (DD-MM-YYYY)
        normalized.sort((a, b) => {
            const [da, ma, ya] = a.date.split("-").map(Number);
            const [db, mb, yb] = b.date.split("-").map(Number);
            return new Date(yb, mb - 1, db) - new Date(ya, ma - 1, da);
        });

        const latestFive = normalized.slice(0, 5);
        container.innerHTML = "";

        latestFive.forEach((item, index) => {
            const isNew = index === 0;

            const row = document.createElement("a");
            row.href = item.link;
            row.className = "update-item";
            row.target = "_blank";
            row.rel = "noopener";

            const shortTitle = truncateTextByWords(item.title, 80);

            row.innerHTML = `
                <div class="update-left">
                    <span title="${item.title.replace(/"/g, '&quot;')}">${shortTitle}</span>
                </div>
                <div class="update-right">
                    ${isNew ? '<span class="badge-new">NEW</span>' : ''}
                    <span class="date">${item.date}</span>
                </div>
            `;

            container.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading updates:", error);
        container.innerHTML = `<p class="text-center text-danger py-4">Currently No Data</p>`;
    }
}

// ───────────────────────────────────────────────
// Initialize Latest Updates (Homepage Tabs)
// ───────────────────────────────────────────────
function initLatestUpdates() {
    loadLatestFive({
        jsonPath: "assets/data/notifications.json",
        targetId: "notificationsList",
        emptyMessage: "No notifications available.",
        basePath: "resources/notifications/"
    });

    loadLatestFive({
        jsonPath: "assets/data/orders.json",
        targetId: "ordersList",
        emptyMessage: "No orders available.",
        basePath: "resources/orders/"
    });

    loadLatestFive({
        jsonPath: "assets/data/circulars.json",
        targetId: "circularsList",
        emptyMessage: "No circulars available.",
        basePath: "resources/circulars/"
    });

    loadLatestFive({
        jsonPath: "assets/data/press.json",
        targetId: "pressList",
        emptyMessage: "No press releases available.",
        basePath: "resources/press/"
    });
}

// ───────────────────────────────────────────────
// Context-aware "Show All" Buttons for Tabs
// ───────────────────────────────────────────────
function initLatestUpdatesActionButtons() {
    const leftBtn = document.getElementById("leftActionBtn");
    const rightBtn = document.getElementById("rightActionBtn");

    // LEFT PANEL: Orders / Circulars
    if (leftBtn) {
        const ordersTab = document.querySelector('[data-bs-target="#tab-orders"]');
        const circularsTab = document.querySelector('[data-bs-target="#tab-circulars"]');

        leftBtn.href = "orders.html";
        leftBtn.innerHTML = `Show All Orders <i class="bi bi-arrow-right ms-1"></i>`;

        if (ordersTab) {
            ordersTab.addEventListener("shown.bs.tab", () => {
                leftBtn.href = "orders.html";
                leftBtn.innerHTML = `Show All Orders <i class="bi bi-arrow-right ms-1"></i>`;
            });
        }

        if (circularsTab) {
            circularsTab.addEventListener("shown.bs.tab", () => {
                leftBtn.href = "circulars.html";
                leftBtn.innerHTML = `Show All Circulars <i class="bi bi-arrow-right ms-1"></i>`;
            });
        }
    }

    // RIGHT PANEL: Notifications / Press
    if (rightBtn) {
        const notificationsTab = document.querySelector('[data-bs-target="#tab-notifications"]');
        const pressTab = document.querySelector('[data-bs-target="#tab-press"]');

        rightBtn.href = "notifications.html";
        rightBtn.innerHTML = `Show All Notifications <i class="bi bi-arrow-right ms-1"></i>`;

        if (notificationsTab) {
            notificationsTab.addEventListener("shown.bs.tab", () => {
                rightBtn.href = "notifications.html";
                rightBtn.innerHTML = `Show All Notifications <i class="bi bi-arrow-right ms-1"></i>`;
            });
        }

        if (pressTab) {
            pressTab.addEventListener("shown.bs.tab", () => {
                rightBtn.href = "press.html";
                rightBtn.innerHTML = `Show All Press Releases <i class="bi bi-arrow-right ms-1"></i>`;
            });
        }
    }
}

// ───────────────────────────────────────────────
// Run after components are loaded
// ───────────────────────────────────────────────
document.addEventListener('componentsLoaded', () => {
    initLatestUpdates();
    loadNewsTicker();
    initLatestUpdatesActionButtons();
    console.log('Data-driven sections initialized');
});
