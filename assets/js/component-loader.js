/* ========================================
   Component Loader Utility
   Dynamically loads HTML components
   ======================================== */
class ComponentLoader {
    constructor() {
        this.componentsPath = 'components/';
        this.loadedComponents = new Set();
    }

    async loadComponent(componentName, targetSelector, callback = null) {
        try {
            const target = document.querySelector(targetSelector);
            if (!target) {
                console.error(`Target element not found: ${targetSelector}`);
                return false;
            }

            if (this.loadedComponents.has(componentName)) {
                console.log(`Component already loaded: ${componentName}`);
                return true;
            }

            const response = await fetch(`${this.componentsPath}${componentName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load component: ${componentName}`);
            }

            const html = await response.text();
            target.innerHTML = html;

            this.loadedComponents.add(componentName);
            console.log(`✓ Component loaded: ${componentName}`);

            if (callback && typeof callback === 'function') {
                callback();
            }

            return true;
        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
            return false;
        }
    }

    async loadComponents(components) {
        const promises = components.map(comp =>
            this.loadComponent(comp.name, comp.target, comp.callback)
        );

        try {
            await Promise.all(promises);
            console.log('✓ All components loaded successfully');
            document.dispatchEvent(new CustomEvent('componentsLoaded'));
            return true;
        } catch (error) {
            console.error('Error loading components:', error);
            return false;
        }
    }
}

function escapeHtml(text) {
    return String(text ?? '').replace(/[&<>"']/g, char => {
        const entities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return entities[char];
    });
}

function formatAlertMessage(text) {
    return String(text ?? '')
        .trim()
        .split(/\n\s*\n/)
        .map(paragraph => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
        .join('');
}

function sanitizeUrl(url) {
    try {
        const parsedUrl = new URL(String(url ?? ''), window.location.origin);
        if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
            return parsedUrl.href;
        }
    } catch (error) {
        console.warn('Invalid launch alert URL:', error);
    }

    return '';
}

async function loadLaunchAlertConfig() {
    const response = await fetch('assets/data/site-alert.json', { cache: 'no-store' });
    if (!response.ok) {
        throw new Error('Failed to load launch alert configuration');
    }

    return response.json();
}

function buildLaunchAlertModal(config) {
    const existingModal = document.getElementById('launchAlertModal');
    if (existingModal) return existingModal;

    const modal = document.createElement('div');
    modal.className = 'modal fade launch-alert-modal';
    modal.id = 'launchAlertModal';
    modal.tabIndex = -1;
    modal.setAttribute('aria-labelledby', 'launchAlertTitle');
    modal.setAttribute('aria-hidden', 'true');

    const title = config.title ? escapeHtml(config.title) : 'Important Notice';
    const message = formatAlertMessage(config.message);
    const buttonText = escapeHtml(config.buttonText || 'Close');
    const ctaText = escapeHtml(config.ctaText || 'Open Link');
    const ctaUrl = sanitizeUrl(config.ctaUrl);
    const ctaMarkup = ctaUrl
        ? `<a class="btn btn-warning launch-alert-cta" href="${ctaUrl}" target="_blank" rel="noopener">
                <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
                <span>${ctaText}</span>
           </a>`
        : '';

    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="launch-alert-title-wrap">
                        <span class="launch-alert-badge">
                            <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
                            <span>Official Alert</span>
                        </span>
                        <h2 class="modal-title h5 mb-0" id="launchAlertTitle">${title}</h2>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="launch-alert-lead">
                        <i class="bi bi-megaphone-fill" aria-hidden="true"></i>
                        <span>Please review the following recruitment notice carefully.</span>
                    </div>
                    <div class="launch-alert-message">${message}</div>
                </div>
                <div class="modal-footer">
                    ${ctaMarkup}
                    <button type="button" class="btn btn-primary launch-alert-close" data-bs-dismiss="modal">${buttonText}</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    return modal;
}

function wasLaunchAlertShown(storageKey) {
    try {
        return window.sessionStorage.getItem(storageKey) === 'shown';
    } catch (error) {
        console.warn('Session storage unavailable for launch alert state:', error);
        return false;
    }
}

function wasPersistentLaunchAlertShown(storageKey) {
    try {
        return window.localStorage.getItem(storageKey) === 'shown';
    } catch (error) {
        console.warn('Local storage unavailable for launch alert state:', error);
        return false;
    }
}

function markLaunchAlertShown(storageKey) {
    try {
        window.sessionStorage.setItem(storageKey, 'shown');
    } catch (error) {
        console.warn('Unable to persist launch alert state:', error);
    }
}

function markPersistentLaunchAlertShown(storageKey) {
    try {
        window.localStorage.setItem(storageKey, 'shown');
    } catch (error) {
        console.warn('Unable to persist launch alert state in local storage:', error);
    }
}

function shouldShowLaunchAlert(displayMode, storageKey) {
    if (displayMode === 'always') {
        return true;
    }

    if (displayMode === 'persistent') {
        return !wasPersistentLaunchAlertShown(storageKey);
    }

    return !wasLaunchAlertShown(storageKey);
}

function markLaunchAlertState(displayMode, storageKey) {
    if (displayMode === 'persistent') {
        markPersistentLaunchAlertShown(storageKey);
        return;
    }

    if (displayMode !== 'always') {
        markLaunchAlertShown(storageKey);
    }
}

async function showLaunchAlertOncePerSession() {
    try {
        const config = await loadLaunchAlertConfig();
        if (!config?.enabled) return;

        const storageKey = config.storageKey || 'ceododa-launch-alert';
        const displayMode = config.displayMode || 'session';
        if (!shouldShowLaunchAlert(displayMode, storageKey)) return;

        const modalElement = buildLaunchAlertModal(config);
        markLaunchAlertState(displayMode, storageKey);

        if (!window.bootstrap?.Modal) {
            modalElement.classList.add('show');
            modalElement.style.display = 'block';
            document.body.classList.add('modal-open');
            return;
        }

        const modal = new window.bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: true
        });
        modal.show();
    } catch (error) {
        console.error('Error showing launch alert:', error);
    }
}

// Global instance
const componentLoader = new ComponentLoader();

// Auto-load when DOM ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔄 Loading components...');

    const componentsToLoad = [
        { name: 'navbar',         target: '#navbar-placeholder' },
        { name: 'hero',           target: '#hero-placeholder' },
        { name: 'news-ticker',    target: '#news-ticker-placeholder' },
        { name: 'about',          target: '#about-placeholder' },
        { name :'latest-updates',    target: '#latest-updates-placeholder'},
        { name: 'initiatives',    target: '#initiatives-placeholder' },
        { name: 'blogs',          target: '#blogs-placeholder' },

        { name: 'contact',        target: '#contact-placeholder' },
        { name: 'footer',         target: '#footer-placeholder' }
        // Add more later: gallery, stats, etc.
    ];

    await componentLoader.loadComponents(componentsToLoad);
    await showLaunchAlertOncePerSession();
});