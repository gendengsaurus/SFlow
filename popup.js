document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const themeToggle = document.getElementById('theme-toggle');
    const themeSelect = document.getElementById('theme-select');
    const loveBtn = document.getElementById('love-btn');
    const supportLinks = document.getElementById('support-links');

    // Load Initial State
    chrome.storage.local.get(['theme', 'isEnabled'], (result) => {
        // Theme defaults to 'dracula' if not set
        const currentTheme = result.theme || 'dracula';
        const isEnabled = result.isEnabled !== false; // Default true

        // Update UI
        themeSelect.value = currentTheme === 'default' ? 'dracula' : currentTheme;
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

    // Support Button Handler
    loveBtn.addEventListener('click', () => {
        supportLinks.classList.toggle('hidden');
        // Optional: Animate chevron or icon if desired
    });

    // Helper to save state
    function saveState(theme, isEnabled) {
        chrome.storage.local.set({
            theme: theme,
            isEnabled: isEnabled
        }, () => {
            console.log('ScriptFlow: Settings saved', { theme, isEnabled });
        });
    }
});
