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
});