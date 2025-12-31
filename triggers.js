class TriggerService {
    constructor() {
        this.projectId = this.getProjectId();
    }

    getProjectId() {
        // URL format: https://script.google.com/home/projects/{id}/edit
        const match = window.location.pathname.match(/projects\/([^\/]+)/);
        return match ? match[1] : null;
    }

    async fetchTriggersPage() {
        if (!this.projectId) {
            console.error('ScriptFlow: Could not determine Project ID');
            return null;
        }

        const url = `https://script.google.com/home/projects/${this.projectId}/triggers`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = await response.text();
            return html;
        } catch (e) {
            console.error('ScriptFlow: Failed to fetch triggers page', e);
            return null;
        }
    }

    // Experimental: Parse the HTML to find bootstrap data or JSON blobs
    parseTriggerData(html) {
        if (!html) return [];

        const triggers = [];

        // Attempt to find function names in the HTML
        // This is highly heuristic. We look for patterns like "functionName" or table cells.
        // Google often uses "ds:X" format. 
        // For now, if we can't reliably parse without a sample, we return a "Detected Connection" signal
        // and let the UI show "No Triggers Found" or the mock if debugging.

        // Simple heuristic: Look for text that looks like a function name followed by "Head" or "Time-driven"
        // This is fragile. A better approach for the "Add Trigger" is to provide code snippets.

        console.log('ScriptFlow: Parsing triggers (Length: ' + html.length + ')');

        // If we really want to parse, we'd need to inspect `AF_initDataCallback`
        // regex: /AF_initDataCallback\s*\(\s*{key:\s*'ds:(\d+)'/g

        return triggers;
    }

    generateTriggerSnippet(functionName, type, interval) {
        // Sanitize function name to prevent code injection
        const safeFuncName = functionName.replace(/[^a-zA-Z0-9_]/g, '');

        if (type === 'Time-driven') {
            // Map interval values to proper Apps Script methods
            const intervalMethods = {
                'everyMinutes': 'everyMinutes(10)',
                'everyHours': 'everyHours(1)',
                'everyDays': 'everyDays(1)',
                'everyWeeks': 'everyWeeks(1)',
                'atHour': 'atHour(9).everyDays(1)'
            };
            const method = intervalMethods[interval] || 'everyMinutes(10)';

            return `
// Time-driven trigger for ${safeFuncName}
ScriptApp.newTrigger('${safeFuncName}')
  .timeBased()
  .${method}
  .create();`;
        } else if (type === 'Spreadsheet') {
            return `
// Spreadsheet trigger for ${safeFuncName}
ScriptApp.newTrigger('${safeFuncName}')
  .forSpreadsheet(SpreadsheetApp.getActive())
  .onEdit()
  .create();`;
        } else if (type === 'Document') {
            return `
// Document trigger for ${safeFuncName}
ScriptApp.newTrigger('${safeFuncName}')
  .forDocument(DocumentApp.getActiveDocument())
  .onOpen()
  .create();`;
        } else if (type === 'Form') {
            return `
// Form trigger for ${safeFuncName}
ScriptApp.newTrigger('${safeFuncName}')
  .forForm(FormApp.getActiveForm())
  .onFormSubmit()
  .create();`;
        }
        return '// Unknown Trigger Type - please select a valid type';
    }
}

window.triggerService = new TriggerService();
