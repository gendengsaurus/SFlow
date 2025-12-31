class UIManager {
    constructor() {
        this.modal = null;
    }

    // XSS Prevention: Sanitize HTML content
    sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    createModal(title, contentHtml) {
        if (this.modal) {
            this.closeModal();
        }

        const overlay = document.createElement('div');
        overlay.className = 'sflow-modal-overlay';
        overlay.id = 'sflow-modal-overlay';

        overlay.innerHTML = `
            <div class="sflow-modal">
                <div class="sflow-modal-header">
                    <h2>${this.sanitizeHTML(title)}</h2>
                    <button class="sflow-close-btn">&times;</button>
                </div>
                <div class="sflow-modal-body">
                    ${contentHtml}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.modal = overlay;

        // Close handlers
        overlay.querySelector('.sflow-close-btn').addEventListener('click', () => this.closeModal());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeModal();
        });
    }

    closeModal() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }

    async showTriggerManager() {
        this.createModal('Trigger Manager', '<div style="padding: 20px; text-align: center;">Loading triggers...</div>');

        let html = null;
        let triggers = [];
        let isConnected = false;

        if (window.triggerService) {
            try {
                html = await window.triggerService.fetchTriggersPage();
                isConnected = !!html;
                if (html) {
                    triggers = window.triggerService.parseTriggerData(html);
                }
            } catch (e) {
                console.error('Fetch Error', e);
            }
        }

        const renderMock = triggers.length === 0;
        const displayTriggers = renderMock ? [
            { function: 'exampleFunction', event: 'Time-driven', disabled: false }
        ] : triggers;

        const content = `
            <div class="sflow-trigger-container">
                <div class="sflow-tabs" style="display: flex; gap: 10px; margin-bottom: 15px; border-bottom: 1px solid #444;">
                    <button class="sflow-tab-btn active" data-tab="list">Active Triggers</button>
                    <button class="sflow-tab-btn" data-tab="generator">Snippet Generator</button>
                </div>

                <div id="sflow-tab-list" class="sflow-tab-content">
                    <div style="font-size: 12px; margin-bottom: 10px; color: ${isConnected ? '#50fa7b' : '#ffb86c'};">
                        ${isConnected ? (triggers.length > 0 ? `● Found ${triggers.length} triggers` : '● Connected (No triggers parsed)') : '● Read-Only / Mock Mode'}
                    </div>
                
                    <table class="sflow-trigger-table" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #333; text-align: left;">
                                <th style="padding: 10px;">Function</th>
                                <th style="padding: 10px;">Event</th>
                                <th style="padding: 10px;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${displayTriggers.map(t => `
                            <tr style="border-bottom: 1px solid #333;">
                                <td style="padding: 10px;">${this.sanitizeHTML(t.function)}</td>
                                <td style="padding: 10px;">${this.sanitizeHTML(t.event)}</td>
                                <td style="padding: 10px;">
                                    <button class="sflow-btn" disabled style="background: #555; cursor: not-allowed; padding: 2px 8px; font-size: 12px;">Manage</button>
                                </td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div id="sflow-tab-generator" class="sflow-tab-content" style="display: none;">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px;">Function Name</label>
                        <input type="text" id="gen-func-name" class="sflow-input" value="myFunction" style="width: 100%; background: #282a36; color: white; border: 1px solid #444; padding: 8px; border-radius: 4px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px;">Event Type</label>
                        <select id="gen-event-type" class="sflow-input" style="width: 100%; background: #282a36; color: white; border: 1px solid #444; padding: 8px; border-radius: 4px;">
                            <option value="Time-driven">Time-driven (Clock)</option>
                            <option value="Spreadsheet">Spreadsheet (onEdit)</option>
                            <option value="Document">Document (onOpen)</option>
                            <option value="Form">Form (onSubmit)</option>
                        </select>
                    </div>
                    <div id="interval-group" style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px;">Interval</label>
                        <select id="gen-interval" class="sflow-input" style="width: 100%; background: #282a36; color: white; border: 1px solid #444; padding: 8px; border-radius: 4px;">
                            <option value="everyMinutes">Every 10 Minutes</option>
                            <option value="everyHours">Every Hour</option>
                            <option value="everyDays">Every Day</option>
                            <option value="everyWeeks">Every Week</option>
                            <option value="atHour">Daily at 9 AM</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px;">Generated Snippet</label>
                        <textarea id="gen-output" readonly style="width: 100%; height: 120px; background: #1e1e2e; color: #50fa7b; font-family: 'Monaco', 'Consolas', monospace; border: 1px solid #444; padding: 10px; border-radius: 4px; resize: vertical;"></textarea>
                    </div>
                    
                    <button id="sflow-copy-snippet" class="sflow-btn" style="width: 100%; background: #bd93f9; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; font-weight: 600;">Copy Snippet</button>
                </div>
            </div>
        `;

        const body = this.modal.querySelector('.sflow-modal-body');
        if (body) {
            body.innerHTML = content;
            this.setupTabListeners(body);
        }
    }

    setupTabListeners(container) {
        // Tab Switching
        const tabs = container.querySelectorAll('.sflow-tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => {
                    t.classList.remove('active');
                    t.style.borderBottom = 'none';
                    t.style.color = '#aaa';
                });
                tab.classList.add('active');
                tab.style.borderBottom = '2px solid #bd93f9';
                tab.style.color = 'white';

                const target = tab.getAttribute('data-tab');
                container.querySelectorAll('.sflow-tab-content').forEach(c => c.style.display = 'none');

                const targetPanel = container.querySelector(`#sflow-tab-${target}`);
                if (targetPanel) targetPanel.style.display = 'block';
            });
        });

        // Initialize active tab style
        const activeTab = container.querySelector('.sflow-tab-btn.active');
        if (activeTab) {
            activeTab.style.borderBottom = '2px solid #bd93f9';
            activeTab.style.color = 'white';
        }

        // Generator Logic
        const funcInput = container.querySelector('#gen-func-name');
        const typeSelect = container.querySelector('#gen-event-type');
        const intervalSelect = container.querySelector('#gen-interval');
        const intervalGroup = container.querySelector('#interval-group');
        const output = container.querySelector('#gen-output');
        const copyBtn = container.querySelector('#sflow-copy-snippet');

        const updateSnippet = () => {
            if (window.triggerService) {
                // Show/hide interval selector based on trigger type
                if (intervalGroup) {
                    intervalGroup.style.display = typeSelect.value === 'Time-driven' ? 'block' : 'none';
                }

                output.value = window.triggerService.generateTriggerSnippet(
                    funcInput.value,
                    typeSelect.value,
                    intervalSelect ? intervalSelect.value : 'everyMinutes'
                );
            }
        };

        if (funcInput && typeSelect) {
            funcInput.addEventListener('input', updateSnippet);
            typeSelect.addEventListener('change', updateSnippet);
            if (intervalSelect) {
                intervalSelect.addEventListener('change', updateSnippet);
            }
            updateSnippet(); // Initial
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                const text = output.value;
                try {
                    // Modern clipboard API
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(text);
                    } else {
                        // Fallback for older browsers
                        output.select();
                        output.setSelectionRange(0, 99999); // For mobile
                        document.execCommand('copy');
                    }
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => copyBtn.textContent = 'Copy Snippet', 2000);
                } catch (err) {
                    console.error('ScriptFlow: Copy failed', err);
                    copyBtn.textContent = 'Copy Failed';
                    setTimeout(() => copyBtn.textContent = 'Copy Snippet', 2000);
                }
            });
        }
    }
}

window.uiManager = new UIManager();
