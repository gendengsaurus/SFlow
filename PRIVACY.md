# Privacy Policy - ScriptFlow

**Last Updated:** January 1, 2026

## Overview

ScriptFlow ("the Extension") is a browser extension that enhances the Google Apps Script editor with dark themes, productivity tools, and code snippets. This privacy policy explains how we handle your data.

## Data Collection

**ScriptFlow does NOT collect, store, or transmit any personal data.**

### What We Store Locally

The Extension stores the following preferences **locally on your device** using Chrome's `chrome.storage.local` API:

- Theme preference (Dracula, Monokai, Nord, or Default)
- Zen Mode on/off state
- Rainbow Brackets on/off state
- TODO Highlight on/off state
- Font preference

This data:
- ✅ Never leaves your device
- ✅ Is not transmitted to any server
- ✅ Is not shared with any third party
- ✅ Can be deleted by uninstalling the extension

## Permissions

The Extension requires the following permissions:

| Permission | Purpose |
|------------|---------|
| `storage` | Save your theme and feature preferences locally |
| `activeTab` | Apply themes to the current Apps Script editor tab |
| `scripting` | Inject styling and toolbar into the editor |
| `host_permissions` (script.google.com) | Only works on Google Apps Script pages |

## Third-Party Services

ScriptFlow does NOT use any:
- Analytics services
- Tracking pixels
- External APIs
- Cloud storage

## Data Security

Since no data is collected or transmitted, there is no data to secure externally. All preferences are stored using Chrome's built-in secure storage API.

## Children's Privacy

ScriptFlow does not knowingly collect any information from children under 13 years of age.

## Changes to This Policy

We may update this Privacy Policy from time to time. Changes will be reflected in the "Last Updated" date above.

## Contact

If you have questions about this Privacy Policy, please open an issue on our GitHub repository.

---

**ScriptFlow is open source and free to use.**
