class UIManager {
    constructor() {
        this.modal = null;
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
                    <h2>${title}</h2>
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
                                <td style="padding: 10px;">${t.function}</td>
                                <td style="padding: 10px;">${t.event}</td>
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
                        <label style="display: block; margin-bottom: 5px;">FunctionName</label>
                        <input type="text" id="gen-func-name" class="sflow-input" value="myFunction" style="width: 100%; background: #282a36; color: white; border: 1px solid #444; padding: 5px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px;">Event Type</label>
                        <select id="gen-event-type" class="sflow-input" style="width: 100%; background: #282a36; color: white; border: 1px solid #444; padding: 5px;">
                            <option value="Time-driven">Time-driven (Clock)</option>
                            <option value="Spreadsheet">Spreadsheet (onEdit)</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px;">Snippet</label>
                        <textarea id="gen-output" style="width: 100%; height: 100px; background: #282a36; color: #50fa7b; font-family: monospace; border: 1px solid #444; padding: 5px;"></textarea>
                    </div>
                    
                    <button id="sflow-copy-snippet" class="sflow-btn">Copy Snippet</button>
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
        const output = container.querySelector('#gen-output');
        const copyBtn = container.querySelector('#sflow-copy-snippet');

        const updateSnippet = () => {
            if (window.triggerService) {
                output.value = window.triggerService.generateTriggerSnippet(
                    funcInput.value,
                    typeSelect.value,
                    'Minutes(10)' // Default
                );
            }
        };

        if (funcInput && typeSelect) {
            funcInput.addEventListener('input', updateSnippet);
            typeSelect.addEventListener('change', updateSnippet);
            updateSnippet(); // Initial
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                output.select();
                document.execCommand('copy');
                copyBtn.textContent = 'Copied!';
                setTimeout(() => copyBtn.textContent = 'Copy Snippet', 2000);
            });
        }
    }
}

window.uiManager = new UIManager();
