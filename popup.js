document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const themeToggle = document.getElementById('theme-toggle');
    const themeButtons = document.querySelectorAll('.theme-btn');
    const zenToggle = document.getElementById('zen-toggle');
    const rainbowToggle = document.getElementById('rainbow-toggle');
    const todoToggle = document.getElementById('todo-toggle');

    // Tab navigation
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;

            // Update button states
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update content visibility
            tabContents.forEach(content => {
                content.classList.toggle('active', content.id === `tab-${tabId}`);
            });
        });
    });

    // Pro UI elements
    const proBanner = document.getElementById('pro-banner');
    const proBannerText = document.getElementById('pro-banner-text');
    const licensePanel = document.getElementById('license-panel');
    const licenseInput = document.getElementById('license-input');
    const activateBtn = document.getElementById('activate-btn');
    const cancelLicenseBtn = document.getElementById('cancel-license-btn');
    const licenseMessage = document.getElementById('license-message');

    // State
    let currentTheme = 'dracula';
    let isPro = false;
    const PRO_THEMES = ['monokai', 'nord', 'solarized', 'onedark', 'github', 'catppuccin'];

    // License validation
    function isValidFormat(key) {
        return /^SFLOW-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key.toUpperCase().trim());
    }

    function validateChecksum(key) {
        const parts = key.toUpperCase().trim().replace('SFLOW-', '').split('-');
        if (parts.length !== 3) return false;
        const checkPart = parts[0] + parts[1];
        let sum = 0;
        for (let i = 0; i < checkPart.length; i++) sum += checkPart.charCodeAt(i);
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let expected = '';
        for (let i = 0; i < 4; i++) expected += chars[(sum * (i + 1)) % 36];
        return parts[2] === expected;
    }

    // Initialize
    chrome.storage.sync.get(['licenseKey', 'isPro'], (proResult) => {
        isPro = proResult.isPro === true;
        updateProUI();

        chrome.storage.local.get(['theme', 'isEnabled', 'zenMode', 'rainbowBrackets', 'todoHighlight'], (result) => {
            currentTheme = result.theme || 'dracula';
            const isEnabled = result.isEnabled !== false;

            themeToggle.checked = isEnabled && currentTheme !== 'default';
            updateThemeButtons(currentTheme);

            if (zenToggle) zenToggle.checked = result.zenMode || false;
            if (todoToggle) todoToggle.checked = result.todoHighlight || false;
            if (rainbowToggle) {
                rainbowToggle.checked = result.rainbowBrackets || false;
                updateProFeatures();
            }
        });
    });

    function updateProUI() {
        if (isPro) {
            proBanner.classList.remove('inactive');
            proBanner.classList.add('active');
            proBannerText.textContent = '✓ Pro Active';
            licensePanel.classList.remove('visible');

            // Unlock Pro features
            document.querySelectorAll('.pro-locked').forEach(el => {
                el.classList.add('unlocked');
            });
        } else {
            proBanner.classList.remove('active');
            proBanner.classList.add('inactive');
            proBannerText.textContent = 'Upgrade to Pro';
        }
    }

    function updateProFeatures() {
        if (!isPro) {
            document.querySelectorAll('.pro-locked').forEach(el => {
                el.classList.remove('unlocked');
            });
        }
    }

    function updateThemeButtons(themeName) {
        themeButtons.forEach(btn => {
            const btnTheme = btn.dataset.theme;
            btn.classList.toggle('active', btnTheme === themeName);
        });
    }

    function saveTheme(theme) {
        currentTheme = theme;
        const isEnabled = theme !== 'default';
        themeToggle.checked = isEnabled;
        updateThemeButtons(theme);
        chrome.storage.local.set({ theme, isEnabled });
    }

    // Theme Toggle (master switch)
    themeToggle.addEventListener('change', () => {
        const newTheme = themeToggle.checked ? 'dracula' : 'default';
        saveTheme(newTheme);
    });

    // Theme Grid Buttons
    themeButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const theme = btn.dataset.theme;

            if (PRO_THEMES.includes(theme) && !isPro) {
                licensePanel.classList.add('visible');
                licenseMessage.textContent = `${theme.charAt(0).toUpperCase() + theme.slice(1)} is a Pro theme`;
                licenseMessage.className = 'license-message error';
                return;
            }

            saveTheme(theme);
        });
    });

    // Feature toggles
    if (zenToggle) {
        zenToggle.addEventListener('change', () => {
            chrome.storage.local.set({ zenMode: zenToggle.checked });
        });
    }

    if (todoToggle) {
        todoToggle.addEventListener('change', () => {
            chrome.storage.local.set({ todoHighlight: todoToggle.checked });
        });
    }

    if (rainbowToggle) {
        rainbowToggle.addEventListener('change', () => {
            if (!isPro) {
                rainbowToggle.checked = false;
                licensePanel.classList.add('visible');
                licenseMessage.textContent = 'Rainbow Brackets is a Pro feature';
                licenseMessage.className = 'license-message error';
                return;
            }
            chrome.storage.local.set({ rainbowBrackets: rainbowToggle.checked });
        });
    }

    // Font Size Slider (PRO)
    const fontSizeSlider = document.getElementById('font-size-slider');
    const fontSizeValue = document.getElementById('font-size-value');

    if (fontSizeSlider) {
        // Load saved font size
        chrome.storage.local.get(['fontSize'], (result) => {
            const size = result.fontSize || 14;
            fontSizeSlider.value = size;
            fontSizeValue.textContent = size + 'px';
        });

        fontSizeSlider.addEventListener('input', (e) => {
            const size = e.target.value;
            fontSizeValue.textContent = size + 'px';

            if (!isPro) {
                fontSizeSlider.value = 14;
                fontSizeValue.textContent = '14px';
                licensePanel.classList.add('visible');
                licenseMessage.textContent = 'Font Size is a Pro feature';
                licenseMessage.className = 'license-message error';
                return;
            }

            chrome.storage.local.set({ fontSize: parseInt(size) });
        });
    }

    // Auto Theme (PRO)
    const autoThemeToggle = document.getElementById('auto-theme-toggle');
    const autoThemeConfig = document.getElementById('auto-theme-config');
    const dayThemeSelect = document.getElementById('day-theme');
    const nightThemeSelect = document.getElementById('night-theme');

    if (autoThemeToggle) {
        // Load saved auto theme settings
        chrome.storage.local.get(['autoTheme', 'dayTheme', 'nightTheme'], (result) => {
            autoThemeToggle.checked = result.autoTheme || false;
            if (autoThemeConfig) {
                autoThemeConfig.style.display = result.autoTheme ? 'block' : 'none';
            }
            if (dayThemeSelect) dayThemeSelect.value = result.dayTheme || 'default';
            if (nightThemeSelect) nightThemeSelect.value = result.nightTheme || 'dracula';
        });

        autoThemeToggle.addEventListener('change', () => {
            if (!isPro) {
                autoThemeToggle.checked = false;
                licensePanel.classList.add('visible');
                licenseMessage.textContent = 'Auto Theme is a Pro feature';
                licenseMessage.className = 'license-message error';
                return;
            }

            const enabled = autoThemeToggle.checked;
            if (autoThemeConfig) {
                autoThemeConfig.style.display = enabled ? 'block' : 'none';
            }

            chrome.storage.local.set({ autoTheme: enabled });

            if (enabled) {
                applyAutoTheme();
            }
        });
    }

    if (dayThemeSelect) {
        dayThemeSelect.addEventListener('change', () => {
            chrome.storage.local.set({ dayTheme: dayThemeSelect.value });
            if (autoThemeToggle?.checked) applyAutoTheme();
        });
    }

    if (nightThemeSelect) {
        nightThemeSelect.addEventListener('change', () => {
            chrome.storage.local.set({ nightTheme: nightThemeSelect.value });
            if (autoThemeToggle?.checked) applyAutoTheme();
        });
    }

    function applyAutoTheme() {
        const hour = new Date().getHours();
        const isDay = hour >= 6 && hour < 18;
        const theme = isDay ? (dayThemeSelect?.value || 'default') : (nightThemeSelect?.value || 'dracula');
        saveTheme(theme);
        updateThemeButtons(theme);
    }

    // Indent Guides (PRO)
    const indentGuidesToggle = document.getElementById('indent-guides-toggle');

    if (indentGuidesToggle) {
        // Load saved state
        chrome.storage.local.get(['indentGuides'], (result) => {
            indentGuidesToggle.checked = result.indentGuides || false;
        });

        indentGuidesToggle.addEventListener('change', () => {
            if (!isPro) {
                indentGuidesToggle.checked = false;
                licensePanel.classList.add('visible');
                licenseMessage.textContent = 'Indent Guides is a Pro feature';
                licenseMessage.className = 'license-message error';
                return;
            }
            chrome.storage.local.set({ indentGuides: indentGuidesToggle.checked });
        });
    }

    // Line Highlight (PRO)
    const lineHighlightToggle = document.getElementById('line-highlight-toggle');

    if (lineHighlightToggle) {
        chrome.storage.local.get(['lineHighlight'], (result) => {
            lineHighlightToggle.checked = result.lineHighlight || false;
        });

        lineHighlightToggle.addEventListener('change', () => {
            if (!isPro) {
                lineHighlightToggle.checked = false;
                licensePanel.classList.add('visible');
                licenseMessage.textContent = 'Line Highlight is a Pro feature';
                licenseMessage.className = 'license-message error';
                return;
            }
            chrome.storage.local.set({ lineHighlight: lineHighlightToggle.checked });
        });
    }

    // Scroll Progress (PRO)
    const scrollProgressToggle = document.getElementById('scroll-progress-toggle');

    if (scrollProgressToggle) {
        chrome.storage.local.get(['scrollProgress'], (result) => {
            scrollProgressToggle.checked = result.scrollProgress || false;
        });

        scrollProgressToggle.addEventListener('change', () => {
            if (!isPro) {
                scrollProgressToggle.checked = false;
                licensePanel.classList.add('visible');
                licenseMessage.textContent = 'Scroll Progress is a Pro feature';
                licenseMessage.className = 'license-message error';
                return;
            }
            chrome.storage.local.set({ scrollProgress: scrollProgressToggle.checked });
        });
    }

    // Pro Banner click
    proBanner.addEventListener('click', () => {
        if (!isPro) {
            licensePanel.classList.toggle('visible');
            licenseMessage.textContent = '';
        }
    });

    // Cancel license input
    if (cancelLicenseBtn) {
        cancelLicenseBtn.addEventListener('click', () => {
            licensePanel.classList.remove('visible');
            licenseInput.value = '';
            licenseMessage.textContent = '';
        });
    }

    // License input formatting
    licenseInput.addEventListener('input', (e) => {
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
        if (value.length > 5 && value[5] !== '-') value = value.slice(0, 5) + '-' + value.slice(5);
        if (value.length > 10 && value[10] !== '-') value = value.slice(0, 10) + '-' + value.slice(10);
        if (value.length > 15 && value[15] !== '-') value = value.slice(0, 15) + '-' + value.slice(15);
        e.target.value = value;
        licenseMessage.textContent = '';
    });

    // Activate license
    activateBtn.addEventListener('click', () => {
        const key = licenseInput.value.trim();

        if (!key) {
            licenseMessage.textContent = 'Enter a license key';
            licenseMessage.className = 'license-message error';
            return;
        }

        if (!isValidFormat(key)) {
            licenseMessage.textContent = 'Invalid format';
            licenseMessage.className = 'license-message error';
            return;
        }

        if (!validateChecksum(key)) {
            licenseMessage.textContent = 'Invalid license key';
            licenseMessage.className = 'license-message error';
            return;
        }

        // Success!
        chrome.storage.sync.set({
            licenseKey: key.toUpperCase().trim(),
            isPro: true,
            licenseValidatedAt: Date.now()
        }, () => {
            isPro = true;
            licenseMessage.textContent = 'Pro activated!';
            licenseMessage.className = 'license-message success';
            updateProUI();
            licenseInput.value = '';

            setTimeout(() => {
                licensePanel.classList.remove('visible');
            }, 1500);
        });
    });

    // Export/Import Settings (PRO)
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (!isPro) {
                licensePanel.classList.add('visible');
                licenseMessage.textContent = 'Settings Export is a Pro feature';
                licenseMessage.className = 'license-message error';
                return;
            }

            // Export all settings
            chrome.storage.local.get(null, (localData) => {
                chrome.storage.sync.get(['licenseKey', 'isPro'], (syncData) => {
                    const exportData = {
                        version: '1.5.0',
                        exportDate: new Date().toISOString(),
                        local: localData,
                        license: {
                            isPro: syncData.isPro,
                            // Don't export the actual key for security
                        }
                    };

                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `scriptflow-settings-${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                });
            });
        });
    }

    if (importBtn && importFile) {
        importBtn.addEventListener('click', () => {
            if (!isPro) {
                licensePanel.classList.add('visible');
                licenseMessage.textContent = 'Settings Import is a Pro feature';
                licenseMessage.className = 'license-message error';
                return;
            }
            importFile.click();
        });

        importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);

                    if (!data.local) {
                        alert('Invalid settings file');
                        return;
                    }

                    chrome.storage.local.set(data.local, () => {
                        alert('Settings imported! Reload extension to apply.');
                        // Reload popup to show new settings
                        location.reload();
                    });
                } catch (err) {
                    alert('Failed to parse settings file');
                }
            };
            reader.readAsText(file);
            importFile.value = ''; // Reset for next import
        });
    }
});
