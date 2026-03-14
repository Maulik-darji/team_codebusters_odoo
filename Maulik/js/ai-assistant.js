import Storage from './storage.js';

const AIAssistant = {
    messages: [],
    currentModel: 'gemini-2.5-flash',
    // Global API Key provided by site owner
    defaultApiKey: 'AIzaSyDjS5IX5OiPpUeU7Tl8InrQpET8v6SmZck', 

    getApiUrl() {
        // Use user-provided key if exists, otherwise fallback to site-wide default
        const key = localStorage.getItem('GEMINI_API_KEY') || this.defaultApiKey;
        if (!key) return null;
        return `https://generativelanguage.googleapis.com/v1beta/models/${this.currentModel}:generateContent?key=${key}`;
    },

    init() {
        const input = document.getElementById('ai-input');
        const sendBtn = document.getElementById('ai-send');
        const modelSelect = document.getElementById('ai-model-select');

        if (!input || !sendBtn) return;

        // Auto-resize textarea and handle Shift+Enter
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = (input.scrollHeight) + 'px';
        });

        input.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        };

        sendBtn.onclick = () => this.handleSendMessage();

        if (modelSelect) {
            modelSelect.value = this.currentModel;
            modelSelect.onchange = (e) => {
                this.currentModel = e.target.value;
                this.saveHistory(); // Save the new model preference
                this.addMessageToUI('bot', `🔄 Switched to **${e.target.options[e.target.selectedIndex].text}**`, false);
            };
        }
        const historyBtn = document.getElementById('ai-history-btn');
        const historyPanel = document.getElementById('ai-history-panel');
        const clearHistoryBtn = document.getElementById('ai-clear-history');
        const settingsBtn = document.getElementById('ai-settings-btn');
        const settingsPanel = document.getElementById('ai-settings-panel');
        const settingsClose = document.getElementById('ai-settings-close');
        const apiKeyInput = document.getElementById('ai-api-key-input');
        const saveApiKeyBtn = document.getElementById('ai-save-api-key');

        if (!settingsBtn) console.warn("AI Settings button not found in DOM");
        if (!settingsPanel) console.warn("AI Settings panel not found in DOM");

        if (settingsBtn && settingsPanel) {
            settingsBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isHidden = settingsPanel.classList.contains('hidden');
                
                // Close others
                if (historyPanel) historyPanel.classList.add('hidden');
                
                if (isHidden) {
                    settingsPanel.classList.remove('hidden');
                    // Pre-fill with existing key if available
                    const currentKey = localStorage.getItem('GEMINI_API_KEY') || this.defaultApiKey;
                    if (currentKey) apiKeyInput.value = currentKey;
                } else {
                    settingsPanel.classList.add('hidden');
                }
            };
            if (settingsClose) {
                settingsClose.onclick = () => settingsPanel.classList.add('hidden');
            }
        }

        if (saveApiKeyBtn && apiKeyInput) {
            saveApiKeyBtn.onclick = () => {
                const newKey = apiKeyInput.value.trim();
                if (newKey) {
                    localStorage.setItem('GEMINI_API_KEY', newKey);
                    this.addMessageToUI('bot', '✅ API key saved successfully. The AI is now ready.');
                    settingsPanel.classList.add('hidden');
                }
            };
        }

        if (historyBtn && historyPanel) {
            historyBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isHidden = historyPanel.classList.contains('hidden');
                
                // Close others
                if (settingsPanel) settingsPanel.classList.add('hidden');
                
                if (isHidden) {
                    historyPanel.classList.remove('hidden');
                    this.renderHistoryList();
                } else {
                    historyPanel.classList.add('hidden');
                }
            };
        }

        // Global click handler for outside-panel clicks
        document.addEventListener('click', (e) => {
            const isClickInsideHistory = historyPanel && (historyPanel.contains(e.target) || historyBtn.contains(e.target));
            const isClickInsideSettings = settingsPanel && (settingsPanel.contains(e.target) || settingsBtn.contains(e.target));

            if (!isClickInsideHistory && historyPanel) {
                historyPanel.classList.add('hidden');
            }
            if (!isClickInsideSettings && settingsPanel) {
                settingsPanel.classList.add('hidden');
            }
        });

        if (clearHistoryBtn) {
            clearHistoryBtn.onclick = () => {
                if (confirm('Are you sure you want to clear all chat history?')) {
                    this.clearHistory();
                }
            };
        }

        // Load existing history
        this.loadHistory();

        // If no history, add system prompt
        if (this.messages.length === 0) {
            this.messages.push({
                role: "user",
                parts: [{ text: `You are StockPilot AI, a professional inventory manager.
                Your job is to help users manage products, receipts, deliveries, and transfers.
                
                CRITICAL RULES:
                1. If a user asks to perform an action (like adding a product or creating a receipt) but misses REQUIRED information (like SKU, Quantity, or Location), DO NOT guess. Instead, politely ask the user to provide the missing details.
                2. For Product creation: SKU is MANDATORY.
                3. For Receipts/Deliveries: Product Name, Quantity, and Location are MANDATORY.
                4. If you aren't sure which product the user means, ask for clarification.
                5. Always use the tools to execute actions when you have all the information.
                
                Current context: User is logged in as ${Storage.getCurrentUser()?.loginId || 'Guest'}.`}]
            });
        }
    },

    saveHistory() {
        const userId = Storage.getUid();
        if (userId) {
            const data = {
                messages: this.messages,
                model: this.currentModel
            };
            localStorage.setItem(`ai_chat_${userId}`, JSON.stringify(data));
        }
    },

    loadHistory() {
        const userId = Storage.getUid();
        if (!userId) return;
        
        const stored = localStorage.getItem(`ai_chat_${userId}`);
        if (stored) {
            const data = JSON.parse(stored);
            this.messages = data.messages || [];
            this.currentModel = data.model || 'gemini-2.5-flash';

            const modelSelect = document.getElementById('ai-model-select');
            if (modelSelect) modelSelect.value = this.currentModel;

            // Re-render chat UI
            const chatMessages = document.getElementById('ai-chat-messages');
            chatMessages.innerHTML = ''; // Clear initial greeting
            
            this.messages.forEach(m => {
                if (m.parts && m.parts[0].text) {
                    // System prompt is also "user" role, we don't want to show it
                    if (m.parts[0].text.includes("You are StockPilot AI")) return;
                    
                    const role = m.role === 'user' ? 'user' : 'bot';
                    this.addMessageToUI(role, m.parts[0].text, false); // Don't save history when loading
                }
            });
            this.scrollToBottom();
        }
    },


    async handleSendMessage() {
        const input = document.getElementById('ai-input');
        const text = input.value.trim();
        if (!text) return;

        input.value = ''; // Clear input immediately
        input.style.height = 'auto'; // Reset height

        this.addMessageToUI('user', text); 
        this.messages.push({
            role: "user",
            parts: [{ text }]
        });
        this.saveHistory();

        this.showTyping();

        try {
            await this.callGemini();
        } catch (err) {
            this.addMessageToUI(
                'bot',
                `<span style="color: var(--danger)">Sorry, I'm having trouble connecting: ${err.message}</span>`
            );
        } finally {
            this.hideTyping();
        }
    },

    showTyping() {
        const indicator = document.getElementById('ai-typing');
        if (indicator) indicator.style.display = 'flex';
    },

    hideTyping() {
        const indicator = document.getElementById('ai-typing');
        if (indicator) indicator.style.display = 'none';
    },

    async callGemini() {
        const url = this.getApiUrl();
        if (!url) {
            this.addMessageToUI('bot', '⚠️ **AI Configuration Error.** The site owner needs to provide a valid API key.');
            return;
        }

        const chatMessages = document.getElementById('ai-chat-messages');
        const statusDiv = document.createElement('div');
        statusDiv.id = 'ai-status-indicator';
        statusDiv.className = 'ai-msg bot status';
        statusDiv.innerHTML = `
            <div class="ai-status-content">
                <div class="ai-spinner"></div>
                <span>Thinking...</span>
            </div>
            <div id="ai-logs" class="ai-logs"></div>
        `;
        chatMessages.appendChild(statusDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const response = await fetch(this.getApiUrl(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: this.messages,
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 1000
                    },
                    tools: [{
                        function_declarations: [
                            {
                                name: "create_product",
                                description: "Create a new product in the inventory.",
                                parameters: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string", description: "Name of the product" },
                                        sku: { type: "string", description: "Unique SKU ID" },
                                        category: { type: "string" },
                                        stock: { type: "number" },
                                        location: { type: "string" }
                                    },
                                    required: ["name", "sku", "category", "location"]
                                }
                            },
                            {
                                name: "create_receipt",
                                description: "Process an incoming shipment.",
                                parameters: {
                                    type: "object",
                                    properties: {
                                        product_name: { type: "string" },
                                        qty: { type: "number" },
                                        location: { type: "string" },
                                        partner: { type: "string" }
                                    },
                                    required: ["product_name", "qty", "location"]
                                }
                            },
                            {
                                name: "create_delivery",
                                description: "Process an outgoing shipment.",
                                parameters: {
                                    type: "object",
                                    properties: {
                                        product_name: { type: "string" },
                                        qty: { type: "number" },
                                        location: { type: "string" },
                                        partner: { type: "string" }
                                    },
                                    required: ["product_name", "qty", "location"]
                                }
                            },
                            {
                                name: "create_transfer",
                                description: "Transfer stock between locations.",
                                parameters: {
                                    type: "object",
                                    properties: {
                                        product_name: { type: "string" },
                                        qty: { type: "number" },
                                        source: { type: "string" },
                                        dest: { type: "string" }
                                    },
                                    required: ["product_name", "qty", "source", "dest"]
                                }
                            },
                            {
                                name: "create_adjustment",
                                description: "Manually adjust stock level.",
                                parameters: {
                                    type: "object",
                                    properties: {
                                        product_name: { type: "string" },
                                        qty: { type: "number" },
                                        reason: { type: "string" }
                                    },
                                    required: ["product_name", "qty"]
                                }
                            },
                            {
                                name: "get_inventory_status",
                                description: "Get a summary of current stock levels.",
                                parameters: { type: "object", properties: {} }
                            },
                            {
                                name: "get_recent_history",
                                description: "Get recent stock movements.",
                                parameters: {
                                    type: "object",
                                    properties: {
                                        limit: { type: "number" }
                                    }
                                }
                            }
                        ]
                    }]
                })
            });

            const data = await response.json();
            statusDiv.remove(); // Remove thinking indicator
            
            if (data.error) throw new Error(data.error.message);
            
            const candidate = data.candidates[0];
            const content = candidate.content;

            if (content.parts[0].functionCall) {
                const fc = content.parts[0].functionCall;
                await this.handleToolCall(fc);
            } else {
                const botText = content.parts[0].text;
                this.addMessageToUI('bot', botText);
                this.messages.push({ role: "model", parts: [{ text: botText }] });
                this.saveHistory();
            }
        } catch (err) {
            if (statusDiv) statusDiv.remove();
            this.addMessageToUI('bot', `<span style="color: var(--danger)">❌ Error: ${err.message}</span>`);
        }
    },

    logProgress(text) {
        const logArea = document.getElementById('ai-logs');
        if (logArea) {
            const log = document.createElement('div');
            log.className = 'ai-log-entry';
            log.innerHTML = `<span class="ai-log-bullet">›</span> ${text}`;
            logArea.appendChild(log);
            const chatMessages = document.getElementById('ai-chat-messages');
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    },

    async handleToolCall(fc) {
        const name = fc.name;
        const args = fc.args;
        let resultMsg = "";

        // Re-add a status message for tool execution
        const chatMessages = document.getElementById('ai-chat-messages');
        const statusDiv = document.createElement('div');
        statusDiv.className = 'ai-msg bot status';
        statusDiv.innerHTML = `
            <div class="ai-status-content">
                <div class="ai-spinner"></div>
                <span>Executing ${name}...</span>
            </div>
            <div id="ai-logs" class="ai-logs"></div>
        `;
        chatMessages.appendChild(statusDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            this.logProgress(`Accessing database...`);
            const products = await Storage.getProducts();
            const product = (args.product_name) ? products.find(p => p.name.toLowerCase().includes(args.product_name.toLowerCase())) : null;

            if (name === 'create_product') {
                this.logProgress(`Validating parameters for ${args.name}...`);
                await Storage.saveProduct({
                    id: 'PROD-' + Date.now(),
                    name: args.name,
                    sku: args.sku,
                    category: args.category,
                    stock: Number(args.stock) || 0,
                    location: args.location,
                    ownerId: Storage.getUid()
                });
                this.logProgress(`Committing product ${args.sku} to Firestore...`);
                resultMsg = `✅ Successfully added product: **${args.name}** (${args.sku}).`;
            } else if (name === 'create_receipt') {
                if (!product) throw new Error(`Product "${args.product_name}" not found.`);
                this.logProgress(`Creating receipt for ${product.name}...`);
                await Storage.saveMovement({
                    type: 'Receipt',
                    productId: product.id,
                    productName: product.name,
                    qty: Number(args.qty),
                    location: args.location,
                    partner: args.partner || 'Unknown Supplier',
                    status: 'Ready'
                });
                resultMsg = `✅ Created receipt for ${args.qty} units of **${product.name}** at ${args.location}.`;
            } else if (name === 'create_delivery') {
                if (!product) throw new Error(`Product "${args.product_name}" not found.`);
                this.logProgress(`Creating delivery order for ${product.name}...`);
                await Storage.saveMovement({
                    type: 'Delivery',
                    productId: product.id,
                    productName: product.name,
                    qty: Number(args.qty),
                    location: args.location,
                    partner: args.partner || 'Customer',
                    status: 'Ready'
                });
                resultMsg = `✅ Created delivery order for ${args.qty} units of **${product.name}** from ${args.location}.`;
            } else if (name === 'create_transfer') {
                if (!product) throw new Error(`Product "${args.product_name}" not found.`);
                this.logProgress(`Moving stock from ${args.source} to ${args.dest}...`);
                await Storage.saveMovement({
                    type: 'Transfer',
                    productId: product.id,
                    productName: product.name,
                    qty: Number(args.qty),
                    sourceLocation: args.source,
                    location: args.dest,
                    status: 'Ready'
                });
                resultMsg = `✅ Created transfer for ${args.qty} units of **${product.name}** from ${args.source} to ${args.dest}.`;
            } else if (name === 'create_adjustment') {
                if (!product) throw new Error(`Product "${args.product_name}" not found.`);
                this.logProgress(`Adjusting stock for ${product.name}...`);
                await Storage.saveMovement({
                    type: 'Adjustment',
                    productId: product.id,
                    productName: product.name,
                    qty: Number(args.qty),
                    location: product.location,
                    partner: args.reason || 'Manual Adjustment',
                    status: 'Done'
                });
                product.stock = Number(product.stock) + Number(args.qty);
                await Storage.saveProduct(product);
                resultMsg = `✅ Adjusted **${product.name}** stock by ${args.qty}. New stock: ${product.stock}.`;
            } else if (name === 'get_inventory_status') {
                this.logProgress(`Summarizing inventory levels...`);
                const summary = products.map(p => `• ${p.name}: ${p.stock}`).join('<br>');
                resultMsg = `<strong>Current Stock:</strong><br>${summary}`;
            } else if (name === 'get_recent_history') {
                this.logProgress(`Fetching recent movement logs...`);
                const movements = await Storage.getMovements();
                const slice = movements.slice(0, args.limit || 5);
                const list = slice.map(m => `• ${m.date}: ${m.type} ${m.productName} (${m.qty > 0 ? '+' : ''}${m.qty})`).join('<br>');
                resultMsg = `<strong>Recent Activity:</strong><br>${list}`;
            }

            statusDiv.remove();
            this.addMessageToUI('bot', resultMsg);
            this.messages.push({ role: "model", parts: [{ text: resultMsg }] });
            this.saveHistory();
            
            this.logProgress(`Refreshing Dashboard...`);
            // FORCE RE-RENDER
            window.dispatchEvent(new CustomEvent('auth-ready')); 
            // Try specific page refreshers
            if (window.location.pathname.includes('products')) {
                if (typeof renderProducts === 'function') renderProducts();
            }
        } catch (err) {
            statusDiv.remove();
            this.addMessageToUI('bot', `<span style="color: var(--danger)">❌ Action failed: ${err.message}</span>`);
        }
    },

    addMessageToUI(role, text, doScroll = true) {
        const chatMessages = document.getElementById('ai-chat-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-msg ${role}`;
        
        // Simple Markdown rendering
        const formattedText = this.formatMarkdown(text);
        msgDiv.innerHTML = formattedText;
        
        chatMessages.appendChild(msgDiv);
        if (doScroll) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    },

    formatMarkdown(text) {
        if (!text) return '';
        
        // Convert bold **text** to <strong>text</strong>
        let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Convert * item to bullets
        html = html.replace(/^\* (.*)/gm, '• $1');
        
        // Convert newlines to <br>
        html = html.replace(/\n/g, '<br>');
        
        return html;
    },
    renderHistoryList() {
        const list = document.getElementById('ai-history-list');
        if (!list) return;

        const userId = Storage.getUid();
        const stored = localStorage.getItem(`ai_chat_${userId}`);
        if (!stored) {
            list.innerHTML = '<div class="text-center p-4 text-gray-400 text-sm">No history yet.</div>';
            return;
        }

        const data = JSON.parse(stored);
        const messages = data.messages || [];
        
        // Show user messages as history points
        const historyPoints = messages.filter(m => m.role === 'user' && !m.parts[0].text.includes("You are StockPilot AI")).reverse();
        
        list.innerHTML = historyPoints.length ? '' : '<div class="text-center p-4 text-gray-400 text-sm">No past queries.</div>';
        
        historyPoints.forEach((m, idx) => {
            const item = document.createElement('div');
            item.className = 'ai-history-item';
            item.innerHTML = `
                <div class="ai-history-item-date">Past Query</div>
                <div class="ai-history-item-text">${m.parts[0].text}</div>
            `;
            item.onclick = (e) => {
                e.stopPropagation();
                const input = document.getElementById('ai-input');
                input.value = m.parts[0].text;
                document.getElementById('ai-history-panel').classList.add('hidden');
                input.focus();
                // Trigger auto-resize
                input.dispatchEvent(new Event('input'));
            };
            list.appendChild(item);
        });
    },

    clearHistory() {
        const userId = Storage.getUid();
        localStorage.removeItem(`ai_chat_${userId}`);
        this.messages = [];
        this.addMessageToUI('bot', '🧹 Chat history cleared.');
        const historyPanel = document.getElementById('ai-history-panel');
        if (historyPanel) historyPanel.classList.add('hidden');
        const chatMessages = document.getElementById('ai-chat-messages');
        if (chatMessages) chatMessages.innerHTML = '';
        this.init(); // Re-add system prompt
    },
    scrollToBottom() {
        const chatMessages = document.getElementById('ai-chat-messages');
        if (chatMessages) {
            requestAnimationFrame(() => {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            });
        }
    },
};

window.AIAssistant = AIAssistant;
export default AIAssistant;