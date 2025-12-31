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

const SVGs = {
    moon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
    sun: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    lightning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>`,
    clock: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`
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
            <button id="sflow-theme-toggle" class="sflow-icon-btn" title="Toggle Dark Mode">
                ${SVGs.sun}
            </button>
        </div>

        <div class="sflow-control-group">
            <select id="sflow-theme-select">
                <option value="default">Default</option>
                <option value="dracula">Dracula</option>
                <option value="monokai">Monokai</option>
                <option value="nord">Nord</option>
            </select>
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


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
