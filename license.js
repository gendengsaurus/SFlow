/**
 * ScriptFlow License Manager
 * Handles Pro license validation via LemonSqueezy
 */

const LicenseManager = {
    // Pro features that require license
    PRO_FEATURES: ['rainbow_brackets', 'custom_fonts', 'monokai_theme', 'nord_theme', 'custom_snippets', 'all_snippets'],

    // Cache license status
    _isPro: null,
    _licenseKey: null,

    /**
     * Initialize license manager - load from storage
     */
    async init() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['licenseKey', 'isPro', 'licenseValidatedAt'], (result) => {
                if (result.licenseKey && result.isPro) {
                    this._licenseKey = result.licenseKey;
                    this._isPro = true;
                } else {
                    this._isPro = false;
                }
                resolve(this._isPro);
            });
        });
    },

    /**
     * Check if user has Pro license
     */
    async isPro() {
        if (this._isPro === null) {
            await this.init();
        }
        return this._isPro;
    },

    /**
     * Validate license key format: SFLOW-XXXX-XXXX-XXXX
     */
    isValidFormat(key) {
        const pattern = /^SFLOW-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        return pattern.test(key.toUpperCase().trim());
    },

    /**
     * Validate license key with LemonSqueezy API
     * For offline validation, we use a simple checksum
     */
    async validate(key) {
        const normalizedKey = key.toUpperCase().trim();

        // Check format first
        if (!this.isValidFormat(normalizedKey)) {
            return { success: false, error: 'Invalid license key format' };
        }

        // Simple offline validation using checksum
        // In production, this would call LemonSqueezy API
        if (this._validateChecksum(normalizedKey)) {
            // Save to storage
            await this._saveLicense(normalizedKey);
            return { success: true };
        }

        return { success: false, error: 'Invalid license key' };
    },

    /**
     * Simple checksum validation for offline use
     * The last 4 chars should be derived from first 12 chars
     */
    _validateChecksum(key) {
        // Remove SFLOW- prefix and dashes
        const parts = key.replace('SFLOW-', '').split('-');
        if (parts.length !== 3) return false;

        const checkPart = parts[0] + parts[1];
        const checksumPart = parts[2];

        // Simple checksum: sum of char codes mod 36, converted to alphanumeric
        let sum = 0;
        for (let i = 0; i < checkPart.length; i++) {
            sum += checkPart.charCodeAt(i);
        }

        // Generate expected checksum (4 chars)
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let expected = '';
        for (let i = 0; i < 4; i++) {
            expected += chars[(sum * (i + 1)) % 36];
        }

        return checksumPart === expected;
    },

    /**
     * Save license to chrome.storage.sync
     */
    async _saveLicense(key) {
        return new Promise((resolve) => {
            chrome.storage.sync.set({
                licenseKey: key,
                isPro: true,
                licenseValidatedAt: Date.now()
            }, () => {
                this._licenseKey = key;
                this._isPro = true;
                resolve();
            });
        });
    },

    /**
     * Remove license (for testing or deactivation)
     */
    async removeLicense() {
        return new Promise((resolve) => {
            chrome.storage.sync.remove(['licenseKey', 'isPro', 'licenseValidatedAt'], () => {
                this._licenseKey = null;
                this._isPro = false;
                resolve();
            });
        });
    },

    /**
     * Check if a specific feature is unlocked
     */
    async isFeatureUnlocked(feature) {
        // Free features are always unlocked
        if (!this.PRO_FEATURES.includes(feature)) {
            return true;
        }
        return await this.isPro();
    },

    /**
     * Get license key (masked for display)
     */
    getMaskedKey() {
        if (!this._licenseKey) return null;
        // Show only last 4 chars: SFLOW-XXXX-XXXX-XXXX -> SFLOW-****-****-XXXX
        const parts = this._licenseKey.split('-');
        return `SFLOW-****-****-${parts[3]}`;
    },

    /**
     * Generate a valid license key (for testing/admin purposes)
     */
    generateKey() {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let part1 = '';
        let part2 = '';

        // Generate random first two parts
        for (let i = 0; i < 4; i++) {
            part1 += chars[Math.floor(Math.random() * 36)];
            part2 += chars[Math.floor(Math.random() * 36)];
        }

        // Calculate checksum for part3
        const checkPart = part1 + part2;
        let sum = 0;
        for (let i = 0; i < checkPart.length; i++) {
            sum += checkPart.charCodeAt(i);
        }

        let part3 = '';
        for (let i = 0; i < 4; i++) {
            part3 += chars[(sum * (i + 1)) % 36];
        }

        return `SFLOW-${part1}-${part2}-${part3}`;
    }
};

// Export for use in other scripts
window.LicenseManager = LicenseManager;

// Initialize on load
LicenseManager.init();
