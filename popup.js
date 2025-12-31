document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const themeToggle = document.getElementById('theme-toggle');
    const themeSelect = document.getElementById('theme-select');
    const loveBtn = document.getElementById('love-btn');
    const supportLinks = document.getElementById('support-links');

    // Default theme constant for consistency
    const DEFAULT_DARK_THEME = 'dracula';

    // Load Initial State with error handling
    chrome.storage.local.get(['theme', 'isEnabled'], (result) => {
        // Handle potential storage errors
        if (chrome.runtime.lastError) {
            console.error('ScriptFlow: Storage error', chrome.runtime.lastError);
            // Apply defaults on error
            themeSelect.value = DEFAULT_DARK_THEME;
            themeToggle.checked = true;
            themeSelect.disabled = false;
            return;
        }

        // Theme defaults to 'dracula' if not set
        const currentTheme = result.theme || DEFAULT_DARK_THEME;
        const isEnabled = result.isEnabled !== false; // Default true

        // Update UI - Fixed logic: show actual current theme in dropdown
        themeSelect.value = currentTheme !== 'default' ? currentTheme : DEFAULT_DARK_THEME;
        themeToggle.checked = isEnabled && currentTheme !== 'default';

        // Disable select if toggled off
        themeSelect.disabled = !themeToggle.checked;
    });

    // Theme Toggle Handler
    themeToggle.addEventListener('change', () => {
        const isEnabled = themeToggle.checked;
        themeSelect.disabled = !isEnabled;

        // If enabled, use selected value. If disabled, set to 'default'.
        const newTheme = isEnabled ? themeSelect.value : 'default';

        saveState(newTheme, isEnabled);
    });

    // Theme Select Handler
    themeSelect.addEventListener('change', () => {
        if (themeToggle.checked) {
            saveState(themeSelect.value, true);
        }
    });

    // Support Button Handler with accessibility
    loveBtn.addEventListener('click', () => {
        const isHidden = supportLinks.classList.toggle('hidden');
        loveBtn.setAttribute('aria-expanded', !isHidden);
    });

    // Keyboard support for support button
    loveBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            loveBtn.click();
        }
    });

    // Helper to save state with error handling
    function saveState(theme, isEnabled) {
        chrome.storage.local.set({
            theme: theme,
            isEnabled: isEnabled
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('ScriptFlow: Failed to save settings', chrome.runtime.lastError);
                return;
            }
            console.log('ScriptFlow: Settings saved', { theme, isEnabled });
        });
    }
});
