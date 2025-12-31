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
        if (type === 'Time-driven') {
            return `
ScriptApp.newTrigger('${functionName}')
  .timeBased()
  .every${interval}
  .create();`;
        } else if (type === 'Spreadsheet') {
            return `
ScriptApp.newTrigger('${functionName}')
  .forSpreadsheet(SpreadsheetApp.getActive())
  .onEdit()
  .create();`;
        }
        return '// Unknown Trigger Type';
    }
}

window.triggerService = new TriggerService();
