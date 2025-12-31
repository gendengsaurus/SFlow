document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const themeToggle = document.getElementById('theme-toggle');
    const themeSelect = document.getElementById('theme-select');
    const loveBtn = document.getElementById('love-btn');
    const supportLinks = document.getElementById('support-links');

    // Feature toggles
    const zenToggle = document.getElementById('zen-toggle');
    const rainbowToggle = document.getElementById('rainbow-toggle');
    const todoToggle = document.getElementById('todo-toggle');

    // Default theme constant for consistency
    const DEFAULT_DARK_THEME = 'dracula';

    // Load Initial State with error handling
    chrome.storage.local.get([
        'theme', 'isEnabled',
        'zenMode', 'rainbowBrackets', 'todoHighlight'
    ], (result) => {
        // Handle potential storage errors
        if (chrome.runtime.lastError) {
            console.error('ScriptFlow: Storage error', chrome.runtime.lastError);
            applyDefaults();
            return;
        }

        // Theme settings
        const currentTheme = result.theme || DEFAULT_DARK_THEME;
        const isEnabled = result.isEnabled !== false;

        // Update theme UI
        themeSelect.value = currentTheme !== 'default' ? currentTheme : DEFAULT_DARK_THEME;
        themeToggle.checked = isEnabled && currentTheme !== 'default';
        themeSelect.disabled = !themeToggle.checked;

        // Feature toggles
        if (zenToggle) zenToggle.checked = result.zenMode || false;
        if (rainbowToggle) rainbowToggle.checked = result.rainbowBrackets || false;
        if (todoToggle) todoToggle.checked = result.todoHighlight || false;
    });

    function applyDefaults() {
        themeSelect.value = DEFAULT_DARK_THEME;
        themeToggle.checked = true;
        themeSelect.disabled = false;
    }

    // Theme Toggle Handler
    themeToggle.addEventListener('change', () => {
        const isEnabled = themeToggle.checked;
        themeSelect.disabled = !isEnabled;
        const newTheme = isEnabled ? themeSelect.value : 'default';
        saveTheme(newTheme, isEnabled);
    });

    // Theme Select Handler
    themeSelect.addEventListener('change', () => {
        if (themeToggle.checked) {
            saveTheme(themeSelect.value, true);
        }
    });

    // Feature Toggle Handlers
    if (zenToggle) {
        zenToggle.addEventListener('change', () => {
            chrome.storage.local.set({ zenMode: zenToggle.checked });
        });
    }

    if (rainbowToggle) {
        rainbowToggle.addEventListener('change', () => {
            chrome.storage.local.set({ rainbowBrackets: rainbowToggle.checked });
        });
    }

    if (todoToggle) {
        todoToggle.addEventListener('change', () => {
            chrome.storage.local.set({ todoHighlight: todoToggle.checked });
        });
    }

    // Support Button Handler
    loveBtn.addEventListener('click', () => {
        const isHidden = supportLinks.classList.toggle('hidden');
        loveBtn.setAttribute('aria-expanded', !isHidden);
    });

    // Keyboard support
    loveBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            loveBtn.click();
        }
    });

    // Helper to save theme state
    function saveTheme(theme, isEnabled) {
        chrome.storage.local.set({
            theme: theme,
            isEnabled: isEnabled
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('ScriptFlow: Failed to save settings', chrome.runtime.lastError);
            }
        });
    }
});
