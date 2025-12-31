// Content Script - ScriptFlow

console.log('ScriptFlow: Content script loaded');

// === THEME DEFINITIONS ===
const THEMES = {
    default: {
        accent: '#1a73e8',
        fgPrimary: '#202124',
        fgSecondary: '#5f6368',
        bgPrimary: '#ffffff',
        border: '#dadce0'
    },
    dracula: {
        accent: '#BD93F9',
        fgPrimary: '#F8F8F2',
        fgSecondary: '#6272A4',
        bgPrimary: '#282A36',
        border: '#44475A'
    },
    monokai: {
        accent: '#a6e22e',
        fgPrimary: '#f8f8f2',
        fgSecondary: '#75715e',
        bgPrimary: '#272822',
        border: '#49483e'
    },
    nord: {
        accent: '#88c0d0',
        fgPrimary: '#eceff4',
        fgSecondary: '#e5e9f0',
        bgPrimary: '#2e3440',
        border: '#4c566a'
    }
};

// === CLEANUP TRACKING ===
let dashboardFixerInterval = null;
let toolbarObserver = null;
let settingsObserver = null;
let todoHighlightObserver = null;

// === FEATURE STATE ===
let isZenMode = false;
let currentFont = 'default';
let snippetsEnabled = true;

const SVGs = {
    moon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
    sun: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    lightning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>`,
    clock: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    // NEW ICONS
    zen: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>`,
    zenExit: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>`,
    font: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>`,
    todo: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`,
    snippet: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
    command: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path></svg>`,
    // Phase 2 Icons
    rainbow: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18h4a8 8 0 0 0 8-8 8 8 0 0 0-8-8H4"></path><path d="M4 6v12"></path></svg>`,
    snippetAdd: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>`
};

async function init() {
    // Initialize Theme immediately (for all frames, including iframes)
    // Initialize Theme immediately
    loadTheme();

    // Real-time Sync with Popup
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.theme) {
            const newTheme = changes.theme.newValue;
            console.log('ScriptFlow: Theme changed to', newTheme);
            applyTheme(newTheme);

            // Update inline toolbar UI if it exists
            const select = document.getElementById('sflow-theme-select');
            const toggle = document.getElementById('sflow-theme-toggle');
            if (select) select.value = newTheme;
            if (toggle) updateToggleIcon(toggle, newTheme);
        }
    });

    // Only try to inject toolbar if we are likely in the main editor frame
    // but the observer is safe enough.
    waitForToolbarAndInject();

    // Start Dashboard Fixer Loop with cleanup tracking
    if (dashboardFixerInterval) {
        clearInterval(dashboardFixerInterval);
    }
    dashboardFixerInterval = setInterval(fixDashboardTheme, 2000);
}

// === JS-BASED THEME ENFORCER (DEEP SCAN) ===
function fixDashboardTheme() {
    // Only run if we are in a themed mode
    const isThemed = document.body.className.includes('sflow-theme-');
    if (!isThemed || document.body.className.includes('sflow-theme-default')) return;

    // Helper to traverse DOM including Shadow Roots
    function traverse(node, callback) {
        if (!node) return;
        callback(node);

        // Check for Shadow Root
        if (node.shadowRoot) {
            traverse(node.shadowRoot, callback);
        }

        // Traverse children logic
        let children = node.children;
        if (children) {
            for (let i = 0; i < children.length; i++) {
                traverse(children[i], callback);
            }
        }
    }

    // Function to process each node
    function processNode(node) {
        if (!node.tagName) return; // Skip non-elements

        // 0. SPECIFIC USER FIX: 

        // Group A: HEADERS (Pure White)
        // Added .oLvPce (Execution log header) per user request
        if (node.matches && (
            node.matches('.Hjavoc') ||
            node.closest('.Hjavoc') ||
            node.matches('.oLvPce')
        )) {
            node.style.setProperty('color', '#ffffff', 'important');
            if (node.tagName === 'text' || node.tagName === 'tspan') {
                node.style.setProperty('fill', '#ffffff', 'important');
            }
            return; // Done for this node
        }

        // Group B: LABELS / METADATA (Theme Accent/Contrast Color)
        // User requested "more pop". Using --accent-color (e.g., Purple/Pink/Green)
        // Added Project Settings classes: .hz7xXd, .HTsFI, .aiazoe, .VfPpkd-vQzf8d
        // Added .E8iptc (Execution log placeholder) per user request
        const secondaryclasses = [
            '.QCElrd', '.ISlbqe', '.uSHcge', '.Ryburf', '.oHo7ed',
            '.kqOKYb-r4nke', '.BrJaZe', '.JPPyNe', '.Nazv1b',
            '.b8sBwb', '.bqscqe', '.DqxlK', '.xYooXc',
            '.hz7xXd', '.HTsFI', '.aiazoe', '.VfPpkd-vQzf8d',
            '.E8iptc'
        ];

        if (node.matches && node.matches(secondaryclasses.join(', '))) {
            node.style.setProperty('color', 'var(--accent-color)', 'important');
            const children = node.querySelectorAll && node.querySelectorAll('*');
            if (children) {
                children.forEach(child => {
                    child.style.setProperty('color', 'var(--accent-color)', 'important');
                    if (child.tagName === 'text' || child.tagName === 'tspan') {
                        child.style.setProperty('fill', 'var(--accent-color)', 'important');
                    }
                });
            }
        }

        // 0.1 SPECIFIC FIX: Remove White Gradient/Overlay in Execution Log
        // .E1XeTd is the wrapper for the placeholder text. It likely has a white gradient.
        if (node.matches && node.matches('.E1XeTd')) {
            node.style.setProperty('background', 'transparent', 'important');
            node.style.setProperty('background-image', 'none', 'important');
            node.style.setProperty('box-shadow', 'none', 'important');
        }

        // Group S: Settings Specific (Secondary/White Text)
        // .HjuXVb -> Secondary
        if (node.matches && node.matches('.HjuXVb')) {
            node.style.setProperty('color', 'var(--fg-secondary)', 'important');
        }

        // .VfPpkd-aPP78e -> Force White (User Request)
        // Added: .AVdUn, .e30zWd ("Current version"), .dcch3 ("Triggers"), .Y1Vbl ("Executions")
        if (node.matches && (
            node.matches('.VfPpkd-aPP78e') ||
            node.matches('.VfPpkd-V67aGc') ||
            node.matches('.AVdUn') ||
            node.matches('.e30zWd') ||
            node.matches('.dcch3') ||
            node.matches('.Y1Vbl')
        )) {
            node.style.setProperty('color', '#ffffff', 'important');
        }

        // Group F: FORM ELEMENTS & LINKS (Generic)
        // Links -> Accent
        if (node.tagName === 'A') {
            node.style.setProperty('color', 'var(--accent-color)', 'important');
        }

        // Inputs / Textarea
        if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') {
            const type = node.getAttribute('type');
            if (!type || type === 'text' || type === 'password' || type === 'number' || type === 'email' || node.tagName === 'TEXTAREA') {
                node.style.setProperty('background-color', 'transparent', 'important');
                node.style.setProperty('color', 'var(--fg-primary)', 'important');
                node.style.setProperty('border', '1px solid var(--border-color)', 'important');

                // Specific User Request: Filter Input (.Ax4B8) -> Thematic Text
                // Using aria-label for robustness: "Add a trigger filter"
                const ariaLabel = node.getAttribute('aria-label');
                if ((node.matches && node.matches('.Ax4B8')) || (ariaLabel && ariaLabel.includes('filter'))) {
                    node.style.setProperty('color', 'var(--accent-color)', 'important');
                }
            }
            // Radio & Checkboxes -> Accent
            if (type === 'radio' || type === 'checkbox') {
                node.style.setProperty('accent-color', 'var(--accent-color)', 'important');
            }
        }

        // Filter "Add a filter" Label (.PK2PH) -> Thematic
        if (node.matches && node.matches('.PK2PH')) {
            node.style.setProperty('color', 'var(--accent-color)', 'important');
            // The icon is usually a child span .DPvwYc or similar
            const icons = node.querySelectorAll('.DPvwYc, .Ce1Y1c, span[aria-hidden="true"]');
            icons.forEach(icon => {
                // Filter out text nodes if possible, but safe to color spans white if they assume icon role
                icon.style.setProperty('color', '#ffffff', 'important');
            });
        }

        // Specific Icon Class from User Dump (.DPvwYc) -> White
        if (node.matches && (node.matches('.DPvwYc') || node.matches('.Ce1Y1c'))) {
            node.style.setProperty('color', '#ffffff', 'important');
        }

        // Dropdown Items (Filter Lists etc) -> Thematic Text Normal, Accent BG on Hover ONLY
        // Target generic options
        if (node.matches && (
            node.matches('.MocG8c') ||
            node.matches('.OA0qHb') ||
            node.getAttribute('role') === 'option' ||
            node.matches('.dEOOab')
        )) {
            // Default State (Neutral) - No Highlight even if selected
            node.style.setProperty('color', 'var(--accent-color)', 'important');
            node.style.setProperty('background-color', 'transparent', 'important');
            node.style.setProperty('cursor', 'pointer', 'important');

            // Hover Effects via JS Listeners
            if (!node.dataset.hasOptionHover) {
                node.dataset.hasOptionHover = 'true';

                node.addEventListener('mouseenter', () => {
                    // Thematic Highlight on Hover
                    node.style.setProperty('background-color', 'var(--accent-color)', 'important');
                    node.style.setProperty('color', '#ffffff', 'important');
                    const children = node.querySelectorAll('*');
                    children.forEach(c => c.style.setProperty('color', '#ffffff', 'important'));
                });

                node.addEventListener('mouseleave', () => {
                    // Always revert to Neutral (Transparent)
                    node.style.setProperty('background-color', 'transparent', 'important');
                    node.style.setProperty('color', 'var(--accent-color)', 'important');
                    const children = node.querySelectorAll('*');
                    children.forEach(c => c.style.setProperty('color', 'var(--accent-color)', 'important'));
                });
            }
        }

        // Select Input Trigger (.jgvuAb, .VsRsme) -> Transparent + White Text (Neutral), Accent + White (Hover)
        if (node.matches && (node.matches('.jgvuAb') || node.matches('.VsRsme'))) {
            // Neutral State
            node.style.setProperty('background', 'transparent', 'important');
            node.style.setProperty('background-color', 'transparent', 'important');
            node.style.setProperty('color', '#ffffff', 'important');
            node.style.setProperty('border', '1px solid var(--border-color)', 'important');
            node.style.removeProperty('box-shadow');

            const children = node.querySelectorAll('.vRMGwf, .oJeWuf, .Ce1Y1c');
            children.forEach(child => {
                child.style.setProperty('color', '#ffffff', 'important');
            });

            // Add Hover Listeners for Trigger too (per user request "ungu kalau hover aja")
            if (!node.dataset.hasTriggerHover) {
                node.dataset.hasTriggerHover = 'true';
                node.addEventListener('mouseenter', () => {
                    node.style.setProperty('background-color', 'var(--accent-color)', 'important');
                    // Text stays white
                });
                node.addEventListener('mouseleave', () => {
                    node.style.setProperty('background-color', 'transparent', 'important');
                });
            }
        }

        // Specific Popup Container from User HTML (.OA0qNb) -> Dark BG
        if (node.matches && (node.matches('.OA0qNb') || node.matches('.ncFHed'))) {
            node.style.setProperty('background-color', '#2d2d2d', 'important');
            node.style.setProperty('box-shadow', '0 4px 5px 0 rgba(0,0,0,0.14), 0 1px 10px 0 rgba(0,0,0,0.12)', 'important');
            // Ensure it is visible/opacity 1 if it was transparent
            node.style.setProperty('opacity', '1', 'important');
        }

        // Generic Listbox Container (Popup/Menu) -> Dark BG
        // Check if it's NOT the trigger above (using class exclusion or aria-expanded logic)
        // User dump showed trigger has role="listbox" too, so we need careful ordering or exclusion.
        if (node.matches && (
            node.matches('.u3WVdc') ||
            node.matches('.jBmls') ||
            (node.getAttribute('role') === 'listbox' && !node.classList.contains('jgvuAb') && !node.classList.contains('VsRsme'))
        )) {
            node.style.setProperty('background-color', '#2d2d2d', 'important'); // Dark grey background
            node.style.setProperty('box-shadow', '0 4px 5px 0 rgba(0,0,0,0.14), 0 1px 10px 0 rgba(0,0,0,0.12)', 'important');
        }

        // Deployment Label (.nfFC5c) -> Theme BG + White Text (User Request: "container match theme bg")
        if (node.matches && node.matches('.nfFC5c')) {
            // Reset to transparent/inherit since we are styling the parent TH now
            node.style.setProperty('background', 'transparent', 'important');
            node.style.setProperty('color', '#ffffff', 'important');
        }

        // Table Header Cells (.AwADOd, .bXw5fc, .U6mvGe) -> Dark Theme BG & White Text
        if (node.matches && (
            node.matches('.AwADOd') ||
            node.matches('.bXw5fc') ||
            node.matches('.U6mvGe') ||
            node.closest('th[role="columnheader"]') // Robustness for all headers
        )) {
            node.style.setProperty('background-color', 'var(--background-color)', 'important'); // Dark BG
            node.style.setProperty('color', '#ffffff', 'important'); // White Text

            // Ensure child spans (like .T0UZd and .nfFC5c) also get white text if they don't inherit
            const children = node.querySelectorAll('*');
            children.forEach(child => {
                child.style.setProperty('color', '#ffffff', 'important');
            });
        }

        // Table Rows (.aYGNvc, .wkZkfd, and newly identified .k5aVkf, .DIl86b) 
        // Force Theme BG and White Text (fixes "White on White" selection issue)
        // AND handle Hover effects manually since we are forcing inline styles.
        if (node.matches && (
            node.matches('.aYGNvc') ||
            node.matches('.wkZkfd') ||
            node.matches('.k5aVkf') ||
            node.matches('.DIl86b') ||
            node.matches('.XEfnH') ||
            node.matches('.Nofwhd') ||
            node.closest('tr') // Catch-all for rows
        )) {
            // Default State
            node.style.setProperty('background', 'var(--background-color)', 'important');
            node.style.setProperty('color', '#ffffff', 'important');
            node.style.setProperty('cursor', 'pointer', 'important'); // Improve UX

            // Ensure cells inside inherit or force transparent
            const cells = node.querySelectorAll('td');
            cells.forEach(cell => {
                cell.style.setProperty('background', 'transparent', 'important');
                cell.style.setProperty('color', '#ffffff', 'important');
            });

            // Attach Hover Listeners (use dataset to avoid duplicates)
            if (!node.dataset.hasThemeHover) {
                node.dataset.hasThemeHover = 'true';

                node.addEventListener('mouseenter', () => {
                    // Check if it's the current row or generally just highlight
                    // Google Dark Hover Color approx #3c4043 or rgba(255,255,255,0.08)
                    node.style.setProperty('background', '#3c4043', 'important');
                });

                node.addEventListener('mouseleave', () => {
                    node.style.setProperty('background', 'var(--background-color)', 'important');
                });
            }
        }

        // Account Dialog (.XKSfm-Sx9Kwc, role="dialog") -> Dark Theme
        if (node.matches && (
            node.matches('.XKSfm-Sx9Kwc') ||
            node.getAttribute('role') === 'dialog'
        )) {
            // Main Dialog Container
            node.style.setProperty('background-color', '#2d2d2d', 'important'); // Slightly lighter dark for dialogs
            node.style.setProperty('color', '#ffffff', 'important');
            node.style.setProperty('border', '1px solid var(--border-color)', 'important');
            node.style.setProperty('box-shadow', '0 24px 38px 3px rgba(0,0,0,0.14), 0 9px 46px 8px rgba(0,0,0,0.12), 0 11px 15px -7px rgba(0,0,0,0.2)', 'important');

            // Force ALL children to inherit white text (unless buttons)
            // Use specific selectors from user dump for precision
            const textElements = node.querySelectorAll('.XKSfm-Sx9Kwc-r4nke-fmcmS, .auswjd-mzNpsf-Sx9Kwc-xvr5H, .auswjd-mzNpsf-Sx9Kwc-KVuj8d-V1ur5d, [role="heading"], div');
            textElements.forEach(el => {
                el.style.setProperty('color', '#ffffff', 'important');
            });

            // Dialog Buttons
            const buttons = node.querySelectorAll('button');
            buttons.forEach(btn => {
                // Secondary Button "Change account"
                if (btn.getAttribute('name') === 'switch') {
                    btn.style.setProperty('background-color', 'transparent', 'important');
                    btn.style.setProperty('color', 'var(--accent-color)', 'important');
                    btn.style.setProperty('border', '1px solid var(--border-color)', 'important');
                }
                // Primary Button "OK"
                else if (btn.getAttribute('name') === 'ok' || btn.classList.contains('VIpgJd-ldDVFe-zTETae')) {
                    btn.style.setProperty('background-color', 'var(--accent-color)', 'important');
                    btn.style.setProperty('color', '#ffffff', 'important');
                }
            });
        }

        // Google often uses divs with role=radio/checkbox
        if (node.getAttribute && (node.getAttribute('role') === 'radio' || node.getAttribute('role') === 'checkbox')) {
            // We can't easily change the svg color inside without deep drilling,
            // but often setting color on the wrapper helps inheritance.
            // node.style.setProperty('color', 'var(--accent-color)', 'important');
            // Actually, let's look for the inner circle/box usually .OdSotu or similar.
            // For now, let's trust the container color might cascade or use specific classes if found.
        }

        // Group C: TABS (VfPpkd-YVzG2b and Parent Button)

        // Group C: TABS (VfPpkd-YVzG2b and Parent Button)
        // Check if node is the Tab Button or inside it
        const tabButton = node.tagName === 'BUTTON' && node.getAttribute('role') === 'tab' ? node : node.closest('button[role="tab"]');

        if (tabButton) {
            // Check state on the BUTTON
            const isActive = tabButton.getAttribute('aria-selected') === 'true' ||
                tabButton.classList.contains('selected') ||
                tabButton.classList.contains('active');

            // Apply to the specific text and indicator elements inside
            // We only want to apply this if the NODE itself is one of the inner parts we care about
            // Or if we are processing the button itself, we might want to set color on it.

            if (isActive) {
                // Active State: Accent Secondary
                if (node === tabButton || node.closest('.VfPpkd-jY41G-V67aGc') || node.matches('.VfPpkd-YVzG2b')) {
                    node.style.setProperty('color', 'var(--accent-secondary)', 'important');
                }
                if (node.tagName === 'text' || node.tagName === 'tspan') {
                    node.style.setProperty('fill', 'var(--accent-secondary)', 'important');
                }
                // Indicator line specific
                if (node.matches && node.matches('.VfPpkd-YVzG2b')) {
                    node.style.setProperty('border-bottom', '2px solid var(--accent-secondary)', 'important');
                    // If it's a span, maybe it needs background instead? User said "isi tab". 
                    // Sometimes Google uses border-bottom on the text container.
                    // Let's try border-bottom on the text container too, or the indicator span.
                }
            } else {
                // Inactive State: Dimmed Secondary
                if (node === tabButton || node.closest('.VfPpkd-jY41G-V67aGc')) {
                    node.style.setProperty('color', 'var(--fg-secondary)', 'important');
                }
                if (node.tagName === 'text' || node.tagName === 'tspan') {
                    node.style.setProperty('fill', 'var(--fg-secondary)', 'important');
                }
                if (node.matches && node.matches('.VfPpkd-YVzG2b')) {
                    node.style.setProperty('border-bottom', 'none', 'important');
                }
            }
        }

        // Also check if inside Group B containers (if inheritance fails)
        if (node.tagName === 'span' || node.tagName === 'div' || node.tagName === 'a' || node.tagName === 'h1' || node.tagName === 'h2') {
            // Extended list for Settings Page
            const settingsClasses = [
                'blLNhc', // Page Title "Project Settings"
                'HQixOd', // Section Headers "IDs"
                'gQU5Vd', // Description Text "General settings"
                'PbnGhe', // Main Content Wrapper
                'wYnUv',  // Muted text
                'tOrNgd', // Header area
                'Wvd84e'  // Settings cards
            ];

            if (node.closest(secondaryclasses.join(', ')) || node.closest(settingsClasses.join(', ')) || node.matches(settingsClasses.join(', '))) {
                // If it's a header or title, use Accent Color
                if (node.matches && (node.matches('.blLNhc, .HQixOd, .tOrNgd') || node.closest('.blLNhc, .HQixOd'))) {
                    node.style.setProperty('color', 'var(--accent-color)', 'important');
                } else if (node.matches && node.matches('.wYnUv, .gQU5Vd')) {
                    // Descriptions -> Secondary Text
                    node.style.setProperty('color', 'var(--fg-secondary)', 'important');
                } else {
                    // General Text -> Primary
                    node.style.setProperty('color', 'var(--fg-primary)', 'important');
                }
            }
        }

        // 1. Target Known Containers (from HTML dump)
        if (node.matches && (node.matches('.g3VIld, .Wvd84e, .ZZhnYe, .vKkXhe, .OkCl1d'))) {
            node.style.setProperty('background-color', 'var(--bg-secondary)', 'important');
            node.style.setProperty('color', 'var(--fg-primary)', 'important');
            node.style.setProperty('box-shadow', 'none', 'important');
            node.style.setProperty('border', '1px solid var(--border-color)', 'important');
        }

        // 2. Global White Killer
        try {
            const style = window.getComputedStyle(node);
            if (style.backgroundColor === 'rgb(255, 255, 255)' || style.backgroundColor === '#ffffff') {
                if (!node.matches('.g3VIld, .Wvd84e, .ZZhnYe, .vKkXhe, .OkCl1d')) {
                    node.style.setProperty('background-color', 'transparent', 'important');
                }
            }

            // 3. Fix SVG Elements specifically
            if (node.tagName === 'rect') {
                const fill = node.getAttribute('fill');
                if (fill === '#ffffff' || fill === '#fff' || fill === 'white' || style.fill === 'rgb(255, 255, 255)') {
                    node.style.setProperty('fill', 'var(--bg-secondary)', 'important');
                }
            }
            if (node.tagName === 'text' || node.tagName === 'tspan') {
                const color = style.fill || style.color;
                // Fix black text
                if (color === 'rgb(0, 0, 0)' || color === '#000000' || color === 'rgba(0, 0, 0, 0.87)') {
                    node.style.setProperty('fill', 'var(--fg-primary)', 'important');
                    node.style.setProperty('color', 'var(--fg-primary)', 'important');
                }
                // Fix dark grey text
                if (color === 'rgb(68, 68, 68)' || color === 'rgba(68, 68, 68, 0.5)') {
                    node.style.setProperty('fill', 'var(--fg-secondary)', 'important');
                    node.style.setProperty('color', 'var(--fg-secondary)', 'important');
                }
            }
            if (node.tagName === 'path') {
                if (node.getAttribute('stroke') === '#e6e6e6' || style.stroke === 'rgb(230, 230, 230)') {
                    node.style.setProperty('stroke', 'var(--border-color)', 'important');
                }
            }

        } catch (e) {
            // style failure
        }
    }

    // Start Traversal
    traverse(document.body, processNode);
}


function loadTheme() {
    try {
        chrome.storage.local.get(['theme'], (result) => {
            if (chrome.runtime.lastError) {
                console.warn('ScriptFlow: Storage error, using default theme');
                applyTheme('dracula'); // Default fallback
                return;
            }
            if (result.theme) {
                applyTheme(result.theme);
                // Also update the select if it exists (main frame)
                const select = document.getElementById('sflow-theme-select');
                const toggle = document.getElementById('sflow-theme-toggle');
                if (select) select.value = result.theme;
                if (toggle) updateToggleIcon(toggle, result.theme);
            } else {
                applyTheme('dracula'); // Default for new users
            }
        });
    } catch (e) {
        console.warn('ScriptFlow: Extension context invalid', e);
    }
}

function updateToggleIcon(btn, theme) {
    if (theme === 'default') {
        btn.innerHTML = SVGs.moon;
        btn.title = "Switch to Dark Mode";
    } else {
        btn.innerHTML = SVGs.sun;
        btn.title = "Switch to Light Mode";
    }
}

function waitForToolbarAndInject() {
    const observer = new MutationObserver((mutations, obs) => {
        const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
        // Strategy: Find the wrapper that contains "Execution log"
        // Often GAS has a structure like: [Debug] [Wrapper -> [Execution Log]]
        // or [Debug] [Execution Log]

        let targetNode = null;

        // Find all elements with text 'Execution log'
        const allDivs = Array.from(document.querySelectorAll('div, button, span'));
        const execLogElement = allDivs.find(el => el.textContent && el.textContent.trim() === 'Execution log' && el.offsetParent !== null); // Visible only

        if (execLogElement) {
            // We want to append to the container that holds this button/element.
            // Usually we want to go up to the flex item wrapper.
            // Let's try to find the button/role="button" ancestor or the element itself.
            const buttonAncestor = execLogElement.closest('[role="button"]') || execLogElement.closest('button') || execLogElement;

            if (buttonAncestor) {
                targetNode = buttonAncestor;
            }
        } else {
            // Fallback to "Debug" if Execution log is not found (e.g. narrowed window)
            const debugBtn = buttons.find(b => b.textContent.includes('Debug'));
            if (debugBtn) targetNode = debugBtn;
        }

        if (targetNode && targetNode.parentElement) {
            const container = targetNode.parentElement;
            if (container && !document.getElementById('sflow-toolbar')) {
                // Insert AFTER the target node
                injectToolbarInline(container, targetNode.nextSibling);
                obs.disconnect();
            }
        }
    });

    // Store reference for potential cleanup
    toolbarObserver = observer;
    observer.observe(document.body, { childList: true, subtree: true });

    // Safety timeout: disconnect observer after 30 seconds if toolbar not found
    setTimeout(() => {
        if (toolbarObserver && !document.getElementById('sflow-toolbar')) {
            console.log('ScriptFlow: Toolbar observer timeout - disconnecting');
            toolbarObserver.disconnect();
            toolbarObserver = null;
        }
    }, 30000);
}

function injectToolbarInline(container, referenceNode) {
    const toolbar = document.createElement('div');
    toolbar.id = 'sflow-toolbar';
    toolbar.className = 'sflow-toolbar-inline';

    toolbar.innerHTML = `
        <div class="sflow-control-group">
            <button id="sflow-theme-toggle" class="sflow-icon-btn sflow-tooltip" data-tooltip="Toggle Dark/Light Mode">
                ${SVGs.sun}
            </button>
        </div>

        <div class="sflow-control-group">
            <select id="sflow-theme-select" class="sflow-tooltip" data-tooltip="Select Theme">
                <option value="default">Default</option>
                <option value="dracula">Dracula</option>
                <option value="monokai">Monokai</option>
                <option value="nord">Nord</option>
            </select>
        </div>

        <div class="sflow-divider"></div>

        <div class="sflow-control-group">
            <button id="sflow-zen-toggle" class="sflow-icon-btn sflow-tooltip" data-tooltip="Zen Mode (F11)">
                ${SVGs.zen}
            </button>
        </div>

        <div class="sflow-control-group">
            <select id="sflow-font-select" class="sflow-tooltip" data-tooltip="Editor Font">
                <option value="default">Default Font</option>
                <option value="firacode">Fira Code</option>
                <option value="jetbrains">JetBrains Mono</option>
                <option value="cascadia">Cascadia Code</option>
                <option value="source">Source Code Pro</option>
            </select>
        </div>

        <div class="sflow-divider"></div>

        <div class="sflow-control-group">
            <button id="sflow-todo-toggle" class="sflow-icon-btn sflow-tooltip" data-tooltip="Highlight TODO/FIXME">
                ${SVGs.todo}
            </button>
        </div>

        <div class="sflow-control-group">
            <button id="sflow-rainbow-toggle" class="sflow-icon-btn sflow-tooltip" data-tooltip="Rainbow Brackets">
                ${SVGs.rainbow}
            </button>
        </div>

        <div class="sflow-control-group">
            <button id="sflow-snippet-btn" class="sflow-icon-btn sflow-tooltip" data-tooltip="View Snippets (type + Tab)">
                ${SVGs.snippet}
            </button>
        </div>

        <div class="sflow-divider"></div>

        <div class="sflow-control-group">
            <button id="sflow-command-palette" class="sflow-icon-btn sflow-tooltip" data-tooltip="Command Palette (Ctrl+Shift+P)">
                ${SVGs.command}
            </button>
        </div>
    `;


    if (referenceNode) {
        container.insertBefore(toolbar, referenceNode);
    } else {
        container.appendChild(toolbar);
    }
    setupToolbarListeners();
}

function setupToolbarListeners() {
    // Theme Toggle (Sun/Moon)
    const toggleBtn = document.getElementById('sflow-theme-toggle');
    const themeSelect = document.getElementById('sflow-theme-select');

    toggleBtn.addEventListener('click', () => {
        const currentTheme = themeSelect.value;
        const newTheme = currentTheme === 'default' ? 'dracula' : 'default';

        updateThemeState(newTheme);
    });

    // Theme Dropdown
    themeSelect.addEventListener('change', (e) => {
        updateThemeState(e.target.value);
    });

    // === NEW FEATURE LISTENERS ===

    // Zen Mode Button
    const zenBtn = document.getElementById('sflow-zen-toggle');
    if (zenBtn) {
        zenBtn.addEventListener('click', toggleZenMode);
    }

    // Font Selector
    const fontSelect = document.getElementById('sflow-font-select');
    if (fontSelect) {
        fontSelect.addEventListener('change', (e) => {
            applyFont(e.target.value);
        });
    }

    // TODO Highlight Button
    const todoBtn = document.getElementById('sflow-todo-toggle');
    if (todoBtn) {
        todoBtn.addEventListener('click', toggleTodoHighlight);
    }

    // Rainbow Brackets Button
    const rainbowBtn = document.getElementById('sflow-rainbow-toggle');
    if (rainbowBtn) {
        rainbowBtn.addEventListener('click', toggleRainbowBrackets);
    }

    // Snippet Manager Button
    const snippetBtn = document.getElementById('sflow-snippet-btn');
    if (snippetBtn) {
        snippetBtn.addEventListener('click', openSnippetManager);
    }

    // Command Palette Button
    const cmdBtn = document.getElementById('sflow-command-palette');
    if (cmdBtn) {
        cmdBtn.addEventListener('click', openCommandPalette);
    }

    // Initialize Snippet System
    initSnippets();

    // Initialize State
    try {
        chrome.storage.local.get(['theme'], (result) => {
            if (chrome.runtime.lastError) {
                console.warn('ScriptFlow: Storage error, using default theme');
                updateThemeState('dracula');
                return;
            }
            if (result.theme) {
                updateThemeState(result.theme);
            } else {
                updateThemeState('default');
            }
        });
    } catch (e) {
        console.warn('ScriptFlow: Extension context invalid, using default theme');
        updateThemeState('dracula');
    }

    // Helper to sync UI and Storage
    function updateThemeState(themeName) {
        themeSelect.value = themeName;
        applyTheme(themeName);

        // Try to save to storage, but don't fail if context is invalid
        try {
            if (chrome.runtime && chrome.runtime.id) {
                chrome.storage.local.set({ theme: themeName });
            }
        } catch (e) {
            console.warn('ScriptFlow: Could not save theme preference');
        }

        // Update Icon
        if (themeName === 'default') {
            toggleBtn.innerHTML = SVGs.moon; // Show Moon (to switch to dark)
            toggleBtn.title = "Switch to Dark Mode";
        } else {
            toggleBtn.innerHTML = SVGs.sun; // Show Sun (to switch to light)
            toggleBtn.title = "Switch to Light Mode";
        }
    }

    // Setup keyboard shortcuts
    setupGlobalShortcuts();

    // Load saved feature settings (after a small delay to ensure DOM is ready)
    setTimeout(loadFeatureSettings, 500);
}

function applyTheme(themeName) {
    const classes = document.body.className.split(' ').filter(c => !c.startsWith('sflow-theme-'));
    document.body.className = classes.join(' ');

    if (themeName !== 'default') {
        document.body.classList.add(`sflow-theme-${themeName}`);
    }

    // Apply specific settings styles
    const theme = THEMES[themeName] || THEMES['dracula'];
    injectSettingsStyles({
        name: themeName,
        accent: theme.accent,
        fgPrimary: theme.fgPrimary,
        fgSecondary: theme.fgSecondary,
        bgPrimary: theme.bgPrimary,
        border: theme.border
    });
}




// Function to inject dedicated CSS for Settings Page
function injectSettingsStyles(themeParams) {
    const styleId = 'sflow-settings-styles';
    const cssContent = `
        .blLNhc, .HQixOd, .tOrNgd, .blLNhc *, .HQixOd *, .tOrNgd *,
        .hz7xXd, .HTsFI, .aiazoe, .VfPpkd-vQzf8d, .VfPpkd-vQzf8d * {
            color: ${themeParams.accent} !important;
        }
        .gQU5Vd, .wYnUv, .gQU5Vd *, .wYnUv *, .HjuXVb {
            color: ${themeParams.fgSecondary} !important;
        }
        .VfPpkd-aPP78e, .VfPpkd-aPP78e * {
             color: ${themeParams.fgPrimary} !important;
        }
        .PbnGhe, .Wvd84e, .vcug3d .vKkXhe, .vcug3d .OvakSe {
            background-color: transparent !important;
            color: ${themeParams.fgPrimary} !important;
        }
        /* Fix for potential white background on cards */
        .Wvd84e {
             background: rgba(0, 0, 0, 0.2) !important;
             border: 1px solid ${themeParams.border} !important;
        }
        .PbnGhe {
            background-color: ${themeParams.bgPrimary} !important;
        }
        /* Ensure inputs (checkboxes etc) text inheritance */
        label, span, div {
             color: inherit; 
        }
    `;

    // Internal function to perform the actual injection
    const performInjection = (root = document) => {
        // 1. Inject into current root (Main or Shadow)
        let rootHead = root.head || root; // ShadowRoot doesn't have head, use root itself

        let styleEl = root.getElementById ? root.getElementById(styleId) : root.querySelector('#' + styleId);

        if (themeParams.name === 'default') {
            if (styleEl) styleEl.remove();
        } else {
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = styleId;
                rootHead.appendChild(styleEl);
            }
            // Update content if changed
            if (styleEl.textContent !== cssContent) {
                styleEl.textContent = cssContent;
            }
        }

        // 2. Scan for Shadow Roots within this root and recurse
        const allElements = root.querySelectorAll('*');
        allElements.forEach(el => {
            if (el.shadowRoot) {
                // Determine if we've already handled this shadow root to avoid infinite checking if possible
                // But for now, just try to inject.
                performInjection(el.shadowRoot);
            }
        });
    };

    // Initial Injection
    performInjection(document);

    // Setup Observer to handle dynamic content loading (SPA navigation)
    // We only create one observer per page load
    if (!window.sflowSettingsObserver) {
        window.sflowSettingsObserver = new MutationObserver(() => {
            // Debounce or just run? Running performInjection is relatively cheap if checks are fast
            // But for safety, let's just run.
            if (themeParams.name !== 'default') {
                performInjection(document);
            }
        });
        window.sflowSettingsObserver.observe(document.body, { childList: true, subtree: true });
    }
}

// ===========================================
// PHASE 1 FEATURES
// ===========================================

// === ZEN MODE ===
function toggleZenMode() {
    isZenMode = !isZenMode;

    if (isZenMode) {
        document.body.classList.add('sflow-zen-mode');
        console.log('ScriptFlow: Zen Mode enabled');
    } else {
        document.body.classList.remove('sflow-zen-mode');
        console.log('ScriptFlow: Zen Mode disabled');
    }

    // Update button icon
    const zenBtn = document.getElementById('sflow-zen-toggle');
    if (zenBtn) {
        zenBtn.innerHTML = isZenMode ? SVGs.zenExit : SVGs.zen;
        zenBtn.title = isZenMode ? 'Exit Zen Mode (F11)' : 'Zen Mode (F11)';
        zenBtn.classList.toggle('active', isZenMode);
    }

    // Save state
    try {
        chrome.storage.local.set({ zenMode: isZenMode });
    } catch (e) {
        console.warn('ScriptFlow: Could not save Zen Mode state');
    }
}

// === FONT MANAGER ===
const FONTS = {
    default: { family: 'inherit', name: 'Default' },
    firacode: {
        family: "'Fira Code', 'Fira Mono', monospace",
        name: 'Fira Code',
        url: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&display=swap'
    },
    jetbrains: {
        family: "'JetBrains Mono', monospace",
        name: 'JetBrains Mono',
        url: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap'
    },
    cascadia: {
        family: "'Cascadia Code', 'Cascadia Mono', monospace",
        name: 'Cascadia Code',
        url: 'https://fonts.googleapis.com/css2?family=Cascadia+Code&display=swap'
    },
    source: {
        family: "'Source Code Pro', monospace",
        name: 'Source Code Pro',
        url: 'https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500;600&display=swap'
    }
};

function applyFont(fontKey) {
    currentFont = fontKey;
    const font = FONTS[fontKey] || FONTS.default;

    // Load Google Font if needed
    if (font.url) {
        let linkEl = document.getElementById('sflow-font-link');
        if (!linkEl) {
            linkEl = document.createElement('link');
            linkEl.id = 'sflow-font-link';
            linkEl.rel = 'stylesheet';
            document.head.appendChild(linkEl);
        }
        linkEl.href = font.url;
    }

    // Apply font via CSS
    let styleEl = document.getElementById('sflow-font-styles');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'sflow-font-styles';
        document.head.appendChild(styleEl);
    }

    if (fontKey === 'default') {
        styleEl.textContent = '';
    } else {
        styleEl.textContent = `
            .monaco-editor,
            .monaco-editor .view-lines,
            .monaco-editor .view-line,
            .monaco-editor .mtk1,
            .monaco-editor .mtk2,
            .monaco-editor .mtk3,
            .monaco-editor .mtk4,
            .monaco-editor .mtk5,
            .monaco-editor .mtk6,
            .monaco-editor .mtk7,
            .monaco-editor .mtk8,
            .monaco-editor .mtk9,
            .monaco-editor .mtk10,
            .monaco-editor .mtk11,
            .monaco-editor .mtk12,
            .monaco-editor .mtk13,
            .monaco-editor .mtk14,
            .monaco-editor .mtk15,
            .monaco-editor .mtk16,
            .monaco-editor .mtk17,
            .monaco-editor .mtk18,
            .monaco-editor .mtk19,
            .monaco-editor .mtk20,
            .monaco-editor .mtk21,
            .monaco-editor .mtk22,
            .monaco-editor .line-numbers {
                font-family: ${font.family} !important;
                font-feature-settings: "liga" 1, "calt" 1 !important; /* Enable ligatures */
            }
        `;
    }

    console.log('ScriptFlow: Font changed to', font.name);

    // Save preference
    try {
        chrome.storage.local.set({ font: fontKey });
    } catch (e) {
        console.warn('ScriptFlow: Could not save font preference');
    }
}

// === TODO/FIXME HIGHLIGHTER ===
let todoHighlightEnabled = false;

function toggleTodoHighlight() {
    todoHighlightEnabled = !todoHighlightEnabled;

    const todoBtn = document.getElementById('sflow-todo-toggle');
    if (todoBtn) {
        todoBtn.classList.toggle('active', todoHighlightEnabled);
        todoBtn.title = todoHighlightEnabled ? 'TODO Highlighting ON' : 'Highlight TODOs';
    }

    if (todoHighlightEnabled) {
        injectTodoStyles();
        console.log('ScriptFlow: TODO highlighting enabled');
    } else {
        removeTodoStyles();
        console.log('ScriptFlow: TODO highlighting disabled');
    }

    try {
        chrome.storage.local.set({ todoHighlight: todoHighlightEnabled });
    } catch (e) { }
}

function injectTodoStyles() {
    let styleEl = document.getElementById('sflow-todo-styles');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'sflow-todo-styles';
        document.head.appendChild(styleEl);
    }

    // Use CSS to highlight TODO/FIXME/HACK/NOTE in comments
    // This works by targeting comment tokens and using CSS contains selector
    styleEl.textContent = `
        /* Highlight TODO comments - applied via class */
        .sflow-todo { 
            background: rgba(241, 250, 140, 0.3) !important; 
            color: #F1FA8C !important;
            font-weight: 600 !important;
            border-radius: 2px;
            padding: 0 2px;
        }
        .sflow-fixme { 
            background: rgba(255, 85, 85, 0.3) !important; 
            color: #FF5555 !important;
            font-weight: 600 !important;
            border-radius: 2px;
            padding: 0 2px;
        }
        .sflow-hack { 
            background: rgba(255, 184, 108, 0.3) !important; 
            color: #FFB86C !important;
            font-weight: 600 !important;
            border-radius: 2px;
            padding: 0 2px;
        }
        .sflow-note { 
            background: rgba(139, 233, 253, 0.3) !important; 
            color: #8BE9FD !important;
            font-weight: 600 !important;
            border-radius: 2px;
            padding: 0 2px;
        }
    `;
}

function removeTodoStyles() {
    const styleEl = document.getElementById('sflow-todo-styles');
    if (styleEl) {
        styleEl.textContent = '';
    }
}

// === COMMAND PALETTE ===
function openCommandPalette() {
    // Check if already open
    if (document.getElementById('sflow-command-palette-modal')) {
        closeCommandPalette();
        return;
    }

    const commands = [
        { name: 'Toggle Zen Mode', action: toggleZenMode, shortcut: 'F11' },
        {
            name: 'Toggle Dark/Light Mode', action: () => {
                const select = document.getElementById('sflow-theme-select');
                if (select) {
                    const newTheme = select.value === 'default' ? 'dracula' : 'default';
                    select.value = newTheme;
                    select.dispatchEvent(new Event('change'));
                }
            }, shortcut: ''
        },
        { name: 'Theme: Dracula', action: () => setThemeFromPalette('dracula'), shortcut: '' },
        { name: 'Theme: Monokai', action: () => setThemeFromPalette('monokai'), shortcut: '' },
        { name: 'Theme: Nord', action: () => setThemeFromPalette('nord'), shortcut: '' },
        { name: 'Theme: Default (Light)', action: () => setThemeFromPalette('default'), shortcut: '' },
        { name: 'Font: Fira Code', action: () => setFontFromPalette('firacode'), shortcut: '' },
        { name: 'Font: JetBrains Mono', action: () => setFontFromPalette('jetbrains'), shortcut: '' },
        { name: 'Font: Cascadia Code', action: () => setFontFromPalette('cascadia'), shortcut: '' },
        { name: 'Font: Source Code Pro', action: () => setFontFromPalette('source'), shortcut: '' },
        { name: 'Font: Default', action: () => setFontFromPalette('default'), shortcut: '' },
        { name: 'Toggle TODO Highlighting', action: toggleTodoHighlight, shortcut: '' },
        { name: 'Toggle Rainbow Brackets', action: toggleRainbowBrackets, shortcut: '' },
        { name: 'View Snippets', action: openSnippetManager, shortcut: '' },
    ];

    const overlay = document.createElement('div');
    overlay.id = 'sflow-command-palette-modal';
    overlay.className = 'sflow-palette-overlay';

    overlay.innerHTML = `
        <div class="sflow-palette-container">
            <input type="text" class="sflow-palette-input" placeholder="Type a command..." autofocus>
            <div class="sflow-palette-results"></div>
        </div>
    `;

    document.body.appendChild(overlay);

    const input = overlay.querySelector('.sflow-palette-input');
    const results = overlay.querySelector('.sflow-palette-results');

    function renderResults(filter = '') {
        const filtered = commands.filter(cmd =>
            cmd.name.toLowerCase().includes(filter.toLowerCase())
        );

        results.innerHTML = filtered.map((cmd, i) => `
            <div class="sflow-palette-item${i === 0 ? ' selected' : ''}" data-index="${i}">
                <span class="sflow-palette-name">${cmd.name}</span>
                ${cmd.shortcut ? `<span class="sflow-palette-shortcut">${cmd.shortcut}</span>` : ''}
            </div>
        `).join('');

        // Attach click handlers
        results.querySelectorAll('.sflow-palette-item').forEach((item, idx) => {
            item.addEventListener('click', () => {
                filtered[idx].action();
                closeCommandPalette();
            });
        });

        return filtered;
    }

    let filteredCommands = renderResults();
    let selectedIndex = 0;

    input.addEventListener('input', (e) => {
        filteredCommands = renderResults(e.target.value);
        selectedIndex = 0;
    });

    input.addEventListener('keydown', (e) => {
        const items = results.querySelectorAll('.sflow-palette-item');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
            updateSelection(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
            updateSelection(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCommands[selectedIndex]) {
                filteredCommands[selectedIndex].action();
                closeCommandPalette();
            }
        } else if (e.key === 'Escape') {
            closeCommandPalette();
        }
    });

    function updateSelection(items) {
        items.forEach((item, i) => {
            item.classList.toggle('selected', i === selectedIndex);
        });
    }

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeCommandPalette();
        }
    });

    input.focus();
}

function closeCommandPalette() {
    const modal = document.getElementById('sflow-command-palette-modal');
    if (modal) modal.remove();
}

function setThemeFromPalette(themeName) {
    const select = document.getElementById('sflow-theme-select');
    if (select) {
        select.value = themeName;
        select.dispatchEvent(new Event('change'));
    }
}

function setFontFromPalette(fontKey) {
    const select = document.getElementById('sflow-font-select');
    if (select) {
        select.value = fontKey;
        applyFont(fontKey);
    }
}

// === KEYBOARD SHORTCUTS ===
function setupGlobalShortcuts() {
    document.addEventListener('keydown', (e) => {
        // F11 - Zen Mode
        if (e.key === 'F11') {
            e.preventDefault();
            toggleZenMode();
        }

        // Ctrl+Shift+P - Command Palette
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
            e.preventDefault();
            openCommandPalette();
        }

        // Escape - Close modals
        if (e.key === 'Escape') {
            if (isZenMode) {
                toggleZenMode();
            }
            closeCommandPalette();
        }
    });
}

// === LOAD SAVED SETTINGS ===
function loadFeatureSettings() {
    try {
        chrome.storage.local.get(['zenMode', 'font', 'todoHighlight', 'rainbowBrackets'], (result) => {
            if (chrome.runtime.lastError) return;

            // Restore Zen Mode
            if (result.zenMode) {
                isZenMode = false; // Will be toggled to true
                toggleZenMode();
            }

            // Restore Font
            if (result.font && result.font !== 'default') {
                const fontSelect = document.getElementById('sflow-font-select');
                if (fontSelect) fontSelect.value = result.font;
                applyFont(result.font);
            }

            // Restore TODO Highlight
            if (result.todoHighlight) {
                todoHighlightEnabled = false;
                toggleTodoHighlight();
            }

            // Restore Rainbow Brackets
            if (result.rainbowBrackets) {
                rainbowBracketsEnabled = false;
                toggleRainbowBrackets();
            }
        });
    } catch (e) {
        console.warn('ScriptFlow: Could not load feature settings');
    }
}

// ===========================================
// PHASE 2 FEATURES
// ===========================================

// === RAINBOW BRACKETS ===
let rainbowBracketsEnabled = false;

const BRACKET_COLORS = [
    '#FFD700', // Gold
    '#DA70D6', // Orchid  
    '#87CEEB', // Sky Blue
    '#98FB98', // Pale Green
    '#FFA07A', // Light Salmon
    '#DDA0DD', // Plum
];

function toggleRainbowBrackets() {
    rainbowBracketsEnabled = !rainbowBracketsEnabled;

    const rainbowBtn = document.getElementById('sflow-rainbow-toggle');
    if (rainbowBtn) {
        rainbowBtn.classList.toggle('active', rainbowBracketsEnabled);
        rainbowBtn.setAttribute('data-tooltip', rainbowBracketsEnabled ? 'Rainbow Brackets ON' : 'Rainbow Brackets');
    }

    if (rainbowBracketsEnabled) {
        injectRainbowStyles();
        startRainbowObserver();
        console.log('ScriptFlow: Rainbow Brackets enabled');
    } else {
        removeRainbowStyles();
        stopRainbowObserver();
        console.log('ScriptFlow: Rainbow Brackets disabled');
    }

    try {
        chrome.storage.local.set({ rainbowBrackets: rainbowBracketsEnabled });
    } catch (e) { }
}

let rainbowObserver = null;
let rainbowDebounceTimer = null;

function injectRainbowStyles() {
    let styleEl = document.getElementById('sflow-rainbow-styles');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'sflow-rainbow-styles';
        document.head.appendChild(styleEl);
    }

    // CSS-based rainbow colors for brackets
    // Target Monaco's bracket highlighting and bracket characters
    styleEl.textContent = `
        /* Rainbow bracket colors */
        .sflow-rb-0 { color: #FFD700 !important; } /* Gold */
        .sflow-rb-1 { color: #DA70D6 !important; } /* Orchid */
        .sflow-rb-2 { color: #87CEEB !important; } /* Sky Blue */
        .sflow-rb-3 { color: #98FB98 !important; } /* Pale Green */
        .sflow-rb-4 { color: #FFA07A !important; } /* Light Salmon */
        .sflow-rb-5 { color: #DDA0DD !important; } /* Plum */
        
        /* Make brackets more visible */
        .monaco-editor .bracket-match {
            border: 1px solid #FFD700 !important;
            background: rgba(255, 215, 0, 0.1) !important;
        }
        
        /* Color brackets in view lines using attribute targeting */
        .monaco-editor .view-line span:not([class*="mtk"]) {
            /* Default styling */
        }
    `;

    // Initial colorization
    setTimeout(colorizeBrackets, 500);
}

function colorizeBrackets() {
    if (!rainbowBracketsEnabled) return;

    const viewLines = document.querySelectorAll('.monaco-editor .view-line');

    viewLines.forEach(line => {
        const spans = line.querySelectorAll('span');
        let depth = { '(': 0, '[': 0, '{': 0 };

        spans.forEach(span => {
            const text = span.textContent;

            // Check for brackets
            if (text === '(' || text === ')') {
                if (text === '(') {
                    span.className = span.className.replace(/sflow-rb-\d/g, '');
                    span.classList.add(`sflow-rb-${depth['('] % 6}`);
                    depth['(']++;
                } else {
                    depth['('] = Math.max(0, depth['('] - 1);
                    span.className = span.className.replace(/sflow-rb-\d/g, '');
                    span.classList.add(`sflow-rb-${depth['('] % 6}`);
                }
            }
            else if (text === '[' || text === ']') {
                if (text === '[') {
                    span.className = span.className.replace(/sflow-rb-\d/g, '');
                    span.classList.add(`sflow-rb-${depth['['] % 6}`);
                    depth['[']++;
                } else {
                    depth['['] = Math.max(0, depth['['] - 1);
                    span.className = span.className.replace(/sflow-rb-\d/g, '');
                    span.classList.add(`sflow-rb-${depth['['] % 6}`);
                }
            }
            else if (text === '{' || text === '}') {
                if (text === '{') {
                    span.className = span.className.replace(/sflow-rb-\d/g, '');
                    span.classList.add(`sflow-rb-${depth['{'] % 6}`);
                    depth['{']++;
                } else {
                    depth['{'] = Math.max(0, depth['{'] - 1);
                    span.className = span.className.replace(/sflow-rb-\d/g, '');
                    span.classList.add(`sflow-rb-${depth['{'] % 6}`);
                }
            }
        });
    });
}

function startRainbowObserver() {
    if (rainbowObserver) return;

    const editorContainer = document.querySelector('.monaco-editor');
    if (!editorContainer) {
        setTimeout(startRainbowObserver, 1000);
        return;
    }

    rainbowObserver = new MutationObserver(() => {
        // Debounce the colorization
        clearTimeout(rainbowDebounceTimer);
        rainbowDebounceTimer = setTimeout(colorizeBrackets, 100);
    });

    rainbowObserver.observe(editorContainer, {
        childList: true,
        subtree: true,
        characterData: true
    });
}

function stopRainbowObserver() {
    if (rainbowObserver) {
        rainbowObserver.disconnect();
        rainbowObserver = null;
    }
    clearTimeout(rainbowDebounceTimer);

    // Remove color classes from brackets
    document.querySelectorAll('[class*="sflow-rb-"]').forEach(el => {
        el.className = el.className.replace(/sflow-rb-\d/g, '').trim();
    });
}

function removeRainbowStyles() {
    const styleEl = document.getElementById('sflow-rainbow-styles');
    if (styleEl) {
        styleEl.textContent = '';
    }
    stopRainbowObserver();
}

// === CUSTOM SNIPPETS ===
const DEFAULT_SNIPPETS = {
    'clog': 'Logger.log($1);',
    'clogf': 'Logger.log(`$1: ${$1}`);',
    'func': 'function $1($2) {\n  $3\n}',
    'afunc': 'async function $1($2) {\n  $3\n}',
    'arrow': 'const $1 = ($2) => {\n  $3\n};',
    'foreach': '$1.forEach(($2) => {\n  $3\n});',
    'map': '$1.map(($2) => {\n  $3\n});',
    'filter': '$1.filter(($2) => {\n  $3\n});',
    'try': 'try {\n  $1\n} catch (error) {\n  Logger.log(error);\n}',
    'if': 'if ($1) {\n  $2\n}',
    'ifelse': 'if ($1) {\n  $2\n} else {\n  $3\n}',
    'for': 'for (let i = 0; i < $1; i++) {\n  $2\n}',
    'forin': 'for (const $1 in $2) {\n  $3\n}',
    'forof': 'for (const $1 of $2) {\n  $3\n}',
    'ss': 'SpreadsheetApp.getActiveSpreadsheet()',
    'sheet': 'SpreadsheetApp.getActiveSpreadsheet().getActiveSheet()',
    'range': 'sheet.getRange($1)',
    'getval': 'sheet.getRange($1).getValue()',
    'getvals': 'sheet.getRange($1).getValues()',
    'setval': 'sheet.getRange($1).setValue($2)',
    'setvals': 'sheet.getRange($1).setValues($2)',
    'doc': '/**\n * $1\n * @param {$2} $3 - $4\n * @returns {$5}\n */',
    'todo': '// TODO: $1',
    'fixme': '// FIXME: $1',
    'ui': 'SpreadsheetApp.getUi()',
    'alert': 'SpreadsheetApp.getUi().alert($1)',
    'prompt': 'SpreadsheetApp.getUi().prompt($1)',
    'menu': 'SpreadsheetApp.getUi().createMenu($1)\n  .addItem($2, $3)\n  .addToUi();',
    'trigger': 'ScriptApp.newTrigger($1)\n  .timeBased()\n  .everyMinutes($2)\n  .create();',
    'fetch': 'UrlFetchApp.fetch($1, {\n  method: $2,\n  headers: { "Content-Type": "application/json" },\n  payload: JSON.stringify($3)\n});',
    'json': 'JSON.parse($1)',
    'stringify': 'JSON.stringify($1)',
};

let customSnippets = { ...DEFAULT_SNIPPETS };
let snippetManagerEnabled = true;
let snippetPopup = null;
let snippetBuffer = '';
let selectedSnippetIndex = 0;

function setupSnippetListener() {
    document.addEventListener('keydown', handleSnippetKeydown, true);
}

function handleSnippetKeydown(e) {
    if (!snippetManagerEnabled) return;

    // Only work in Monaco editor
    if (!e.target.closest('.monaco-editor')) {
        hideSnippetPopup();
        snippetBuffer = '';
        return;
    }

    // Handle popup navigation if visible
    if (snippetPopup) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            e.stopPropagation();
            navigateSnippetPopup(1);
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            e.stopPropagation();
            navigateSnippetPopup(-1);
            return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            e.stopPropagation();
            selectCurrentSnippet();
            return;
        }
        if (e.key === 'Escape') {
            hideSnippetPopup();
            snippetBuffer = '';
            return;
        }
    }

    // Reset buffer on certain keys
    if (['Enter', 'Escape', ' ', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        hideSnippetPopup();
        snippetBuffer = '';
        return;
    }

    // Backspace - remove last char
    if (e.key === 'Backspace') {
        snippetBuffer = snippetBuffer.slice(0, -1);
        if (snippetBuffer.length >= 2) {
            showSnippetPopup();
        } else {
            hideSnippetPopup();
        }
        return;
    }

    // Add character to buffer (only if it's a single char)
    if (e.key.length === 1 && /[a-zA-Z0-9_]/.test(e.key)) {
        snippetBuffer += e.key;

        // Show popup after 2 characters
        if (snippetBuffer.length >= 2) {
            showSnippetPopup();
        }
    }
}

function showSnippetPopup() {
    const matches = Object.entries(customSnippets)
        .filter(([trigger]) => trigger.toLowerCase().startsWith(snippetBuffer.toLowerCase()))
        .slice(0, 8); // Limit to 8 results

    if (matches.length === 0) {
        hideSnippetPopup();
        return;
    }

    // Get cursor position from Monaco
    const cursor = document.querySelector('.monaco-editor .cursor');
    if (!cursor) return;

    const cursorRect = cursor.getBoundingClientRect();

    // Create or update popup
    if (!snippetPopup) {
        snippetPopup = document.createElement('div');
        snippetPopup.id = 'sflow-snippet-popup';
        snippetPopup.className = 'sflow-autocomplete-popup';
        document.body.appendChild(snippetPopup);
    }

    selectedSnippetIndex = 0;

    snippetPopup.innerHTML = matches.map(([trigger, code], i) => `
        <div class="sflow-autocomplete-item${i === 0 ? ' selected' : ''}" data-index="${i}" data-trigger="${trigger}">
            <span class="sflow-ac-trigger">${highlightMatch(trigger, snippetBuffer)}</span>
            <span class="sflow-ac-preview">${escapeHtml(code.split('\\n')[0].substring(0, 35))}${code.length > 35 ? '...' : ''}</span>
        </div>
    `).join('');

    // Position popup below cursor
    snippetPopup.style.display = 'block';
    snippetPopup.style.left = `${cursorRect.left}px`;
    snippetPopup.style.top = `${cursorRect.bottom + 4}px`;

    // Add click handlers
    snippetPopup.querySelectorAll('.sflow-autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
            selectedSnippetIndex = parseInt(item.dataset.index);
            selectCurrentSnippet();
        });
    });
}

function highlightMatch(trigger, buffer) {
    const matchLen = buffer.length;
    return `<strong>${trigger.substring(0, matchLen)}</strong>${trigger.substring(matchLen)}`;
}

function hideSnippetPopup() {
    if (snippetPopup) {
        snippetPopup.style.display = 'none';
    }
}

function navigateSnippetPopup(direction) {
    const items = snippetPopup.querySelectorAll('.sflow-autocomplete-item');
    if (items.length === 0) return;

    items[selectedSnippetIndex].classList.remove('selected');
    selectedSnippetIndex = (selectedSnippetIndex + direction + items.length) % items.length;
    items[selectedSnippetIndex].classList.add('selected');
    items[selectedSnippetIndex].scrollIntoView({ block: 'nearest' });
}

function selectCurrentSnippet() {
    const items = snippetPopup.querySelectorAll('.sflow-autocomplete-item');
    if (items.length === 0 || selectedSnippetIndex >= items.length) return;

    const trigger = items[selectedSnippetIndex].dataset.trigger;
    const snippet = customSnippets[trigger];

    if (snippet) {
        insertSnippet(snippet, snippetBuffer.length);
    }

    hideSnippetPopup();
    snippetBuffer = '';
}

function insertSnippet(snippet, deleteChars) {
    // Simulate backspace to delete the trigger word
    for (let i = 0; i < deleteChars; i++) {
        document.execCommand('delete', false);
    }

    // Process snippet - find first $1 placeholder
    let processedSnippet = snippet;

    // Remove all placeholders for now (simplified)
    processedSnippet = processedSnippet.replace(/\$\d/g, '');

    // Insert the snippet text
    document.execCommand('insertText', false, processedSnippet);

    console.log('ScriptFlow: Snippet expanded');
    hideSnippetPopup();
}

function openSnippetManager() {
    if (document.getElementById('sflow-snippet-modal')) {
        closeSnippetManager();
        return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'sflow-snippet-modal';
    overlay.className = 'sflow-palette-overlay';

    const snippetList = Object.entries(customSnippets).map(([trigger, code]) => `
        <div class="sflow-snippet-item">
            <code class="sflow-snippet-trigger">${trigger}</code>
            <span class="sflow-snippet-arrow">→</span>
            <code class="sflow-snippet-code">${escapeHtml(code.split('\n')[0].substring(0, 40))}${code.length > 40 ? '...' : ''}</code>
        </div>
    `).join('');

    overlay.innerHTML = `
        <div class="sflow-snippet-container">
            <div class="sflow-snippet-header">
                <h3>📝 Code Snippets</h3>
                <span class="sflow-snippet-hint">Type trigger + Tab to expand</span>
            </div>
            <div class="sflow-snippet-search">
                <input type="text" class="sflow-snippet-input" placeholder="Search snippets...">
            </div>
            <div class="sflow-snippet-list">
                ${snippetList}
            </div>
            <div class="sflow-snippet-footer">
                <button class="sflow-btn sflow-snippet-close">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Search functionality
    const input = overlay.querySelector('.sflow-snippet-input');
    const list = overlay.querySelector('.sflow-snippet-list');

    input.addEventListener('input', (e) => {
        const filter = e.target.value.toLowerCase();
        const filtered = Object.entries(customSnippets)
            .filter(([trigger, code]) =>
                trigger.toLowerCase().includes(filter) ||
                code.toLowerCase().includes(filter)
            );

        list.innerHTML = filtered.map(([trigger, code]) => `
            <div class="sflow-snippet-item">
                <code class="sflow-snippet-trigger">${trigger}</code>
                <span class="sflow-snippet-arrow">→</span>
                <code class="sflow-snippet-code">${escapeHtml(code.split('\n')[0].substring(0, 40))}${code.length > 40 ? '...' : ''}</code>
            </div>
        `).join('');
    });

    // Close handlers
    overlay.querySelector('.sflow-snippet-close').addEventListener('click', closeSnippetManager);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeSnippetManager();
    });

    // ESC to close
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeSnippetManager();
            document.removeEventListener('keydown', escHandler);
        }
    });

    input.focus();
}

function closeSnippetManager() {
    const modal = document.getElementById('sflow-snippet-modal');
    if (modal) modal.remove();
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Initialize snippet system
function initSnippets() {
    setupSnippetListener();
    console.log('ScriptFlow: Snippet system initialized with', Object.keys(customSnippets).length, 'snippets');
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
