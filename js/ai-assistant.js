import Storage from './storage.js';

const AIAssistant = {
    messages: [],
    currentModel: 'gemini-2.5-flash',
    // Global API Key provided by site owner
    defaultApiKey: 'AIzaSyBdsCjmDB8vkzpUgQURcu6nOsHl7qBT08I', 

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

        // API Key Visibility Toggle
        const toggleBtn = document.getElementById('ai-toggle-api-visibility');
        const apiInput = document.getElementById('ai-api-key-input');
        if (toggleBtn && apiInput) {
            toggleBtn.onclick = (e) => {
                e.stopPropagation();
                const isPassword = apiInput.type === 'password';
                apiInput.type = isPassword ? 'text' : 'password';
                toggleBtn.innerHTML = isPassword ? 
                    '<i data-lucide="eye-off" style="width: 16px; height: 16px;"></i>' : 
                    '<i data-lucide="eye" style="width: 16px; height: 16px;"></i>';
                lucide.createIcons();
            };
        }

        // Load existing history
        this.loadHistory();

        // If no history, add system prompt
        if (this.messages.length === 0) {
            this.messages.push({
                role: "user",
                parts: [{ text: `You are StockPilot AI, a professional and highly efficient inventory manager for the "StockPilot" warehouse systems.
                
                YOUR CAPABILITIES:
                1. Manage Products: Add new items with details (Name, SKU, Category, Stock, Location).
                2. Receipts (Incoming): Record incoming shipments from partners.
                3. Deliveries (Outgoing): Record outgoing shipments to partners.
                4. Transfers (Internal): Move stock between different locations.
                5. Adjustments: Manually correct stock levels.
                6. History: View past stock movements.
                
                WEBSITE CONTEXT:
                - Predefined Categories: Apparel, Electronics, Home Goods, Furniture, Food & Beverage, Automotive, Health & Beauty, Tools, Toys, Office Supplies.
                - Common Locations: Warehouse A, Warehouse B, Rack 1, Rack 2, Cold Storage, Loading Dock.
                
                YOUR PERSONALITY:
                - You are professional, helpful, and concise.
                - You always confirm actions once they are completed successfully.
                - If information is missing (like a SKU or Location for a new product), ask for it politely.
                - You have access to real-time tools to execute these inventory actions.
                
                CRITICAL RULES:
                1. If a user asks to perform an action (like adding a product or creating a receipt) but misses REQUIRED information (like SKU, Quantity, or Location), DO NOT guess. Instead, politely ask the user to provide the missing details.
                2. For Product creation: SKU is MANDATORY.
                3. For Receipts/Deliveries: Product Name, Quantity, and Location are MANDATORY.
                4. If you aren't sure which product the user means, ask for clarification.
                5. Always use the tools to execute actions when you have all the information.
                6. The standard reference format for movements is <WarehouseCode>/<Operation>/<ID> (e.g., MAIN/IN/001, MAIN/OUT/002). Use this format when discussing reference IDs.
                
                Current context: User is logged in as ${Storage.getCurrentUser()?.loginId || 'Guest'}.`}]
            });
        }
    },

    saveHistory() {
        const userId = Storage.getUid();
        if (userId) {
            const data = {
                messages: this.messages,
                model: this.currentModel,
                timestamp: Date.now()
            };
            localStorage.setItem(`ai_chat_${userId}`, JSON.stringify(data));
            if (userId !== 'guest') {
                Storage.saveAIChatHistory(data).catch(e => console.error("Sync error", e));
            }
        }
    },

    loadHistory() {
        const userId = Storage.getUid();
        if (!userId) return;
        
        const stored = localStorage.getItem(`ai_chat_${userId}`);
        let localData = null;
        if (stored) {
            localData = JSON.parse(stored);
            this.applyHistoryData(localData);
        }

        if (userId !== 'guest') {
            Storage.getAIChatHistory().then(cloudData => {
                if (cloudData) {
                    const localTs = localData ? (localData.timestamp || 0) : 0;
                    const cloudTs = cloudData.timestamp || 0;
                    const localMsgCount = localData ? (localData.messages || []).length : 0;
                    const cloudMsgCount = (cloudData.messages || []).length;

                    if (cloudTs > localTs || (cloudMsgCount > localMsgCount && cloudTs >= localTs)) {
                        localStorage.setItem(`ai_chat_${userId}`, JSON.stringify(cloudData));
                        this.applyHistoryData(cloudData);
                    }
                }
            }).catch(e => console.error("Fetch sync error", e));
        }
    },

    applyHistoryData(data) {
        this.messages = data.messages || [];
        this.currentModel = data.model || 'gemini-2.5-flash';

        const modelSelect = document.getElementById('ai-model-select');
        if (modelSelect) modelSelect.value = this.currentModel;

        const chatMessages = document.getElementById('ai-chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = ''; // Clear initial greeting
            
            this.messages.forEach(m => {
                if (m.parts && m.parts[0].text) {
                    // System prompt is also "user" role, we don't want to show it
                    if (m.parts[0].text.includes("You are StockPilot AI")) return;
                    
                    const role = m.role === 'user' ? 'user' : 'bot';
                    this.addMessageToUI(role, m.parts[0].text, false);
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
            // ALWAYS ensure the system prompt is at the top of the history
            const systemPrompt = `You are StockPilot AI, an intelligent inventory assistant for the "StockPilot" warehouse management system.
                
                YOUR CAPABILITIES:
                1. CREATE Products (name, SKU, category, stock, location).
                2. UPDATE Products (edit any field of an existing product).
                3. DELETE Products (with user confirmation).
                4. LIST / SEARCH Products and movements.
                5. CREATE Receipts (incoming shipments from suppliers).
                6. CREATE Deliveries (outgoing shipments to customers).
                7. CREATE Transfers (internal stock moves between locations).
                8. CREATE Adjustments (correct stock quantities).
                9. VALIDATE movements (mark as Done, updates stock).
                10. REJECT receipts (mark as Rejected).
                11. ADVANCE delivery stage (Ready → Picking → Packing → Done).
                12. UPDATE existing movements (change supplier, qty, location).
                13. Get inventory status, recent history, warehouses, and categories.
                
                WEBSITE CONTEXT - USE THESE EXACT OPTIONS:
                - Categories: Apparel, Electronics, Home Goods, Furniture, Food & Beverage, Automotive, Health & Beauty, Tools, Toys, Office Supplies.
                - Locations: Warehouse A, Warehouse B, Rack 1, Rack 2, Cold Storage, Loading Dock, Main Warehouse, Production Floor.
                
                STRICT RULES (follow these without exception):
                1. NEVER assume or guess missing information. If required info is missing, ASK the user for it first.
                2. For create_product: name, SKU, category, location, AND starting stock quantity are ALL required. If the user has not mentioned the stock amount, ALWAYS ASK "What is the starting stock quantity for [product name]?" before creating. ONLY accept 0 if the user explicitly says "0" or "zero" or "no stock".
                3. For create_receipt / create_delivery: product_name, qty (number), and location are ALL required. Ask for any that are missing. If no partner/supplier name given, ask for it.
                4. For create_transfer: product_name, qty, source location, and destination location are ALL required.
                5. If a user says something vague like "add shoes", ask: "What is the SKU, category, location, and starting stock for Shoes?"
                6. If the user asks what categories/locations are available, always list them from the context above.
                7. Always confirm what you did after completing an action.`;

            // Scrub any API keys from history to prevent "leaked key" blocks
            const scrubKeys = (text) => {
                if (!text) return text;
                // Matches typical Gemini API key pattern
                return text.replace(/AIzaSy[A-Za-z0-9_-]{33}/g, '[REDACTED_API_KEY]');
            };

            // Clear any old system prompts and scrub keys from all messages
            const filteredMessages = this.messages
                .filter(m => !m.parts[0].text.includes("You are StockPilot AI"))
                .map(m => ({
                    ...m,
                    parts: m.parts.map(p => ({ ...p, text: scrubKeys(p.text) }))
                }));
            
            const payload = [
                { role: "user", parts: [{ text: scrubKeys(systemPrompt) }] },
                { role: "model", parts: [{ text: "Understood. I am StockPilot AI, ready to manage your inventory." }] },
                ...filteredMessages
            ];

            const response = await fetch(this.getApiUrl(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: payload,
                    generationConfig: {
                        temperature: 0.1, // Lower temperature for more consistent behavior
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
                            },
                            {
                                name: "delete_product",
                                description: "Permanently delete a product from the inventory. Always confirm with the user before deleting.",
                                parameters: {
                                    type: "object",
                                    properties: {
                                        product_name: { type: "string", description: "Name or partial name of the product to delete" }
                                    },
                                    required: ["product_name"]
                                }
                            },
                            {
                                name: "update_product",
                                description: "Update an existing product's details (name, SKU, category, location, stock).",
                                parameters: {
                                    type: "object",
                                    properties: {
                                        product_name: { type: "string", description: "Name of the product to find" },
                                        new_name: { type: "string" },
                                        new_sku: { type: "string" },
                                        new_category: { type: "string" },
                                        new_location: { type: "string" },
                                        new_stock: { type: "number" }
                                    },
                                    required: ["product_name"]
                                }
                            },
                            {
                                name: "validate_movement",
                                description: "Validate (approve/process) a pending receipt, delivery, or transfer order by its reference ID or product name.",
                                parameters: {
                                    type: "object",
                                    properties: {
                                        movement_ref: { type: "string", description: "The reference ID or product name of the movement to validate" },
                                        type: { type: "string", description: "Type: Receipt, Delivery, or Transfer" }
                                    },
                                    required: ["movement_ref"]
                                }
                            },
                            {
                                name: "get_products",
                                description: "List all products in inventory, optionally filtered by category or location.",
                                parameters: {
                                    type: "object",
                                    properties: {
                                        category: { type: "string" },
                                        location: { type: "string" }
                                    }
                                }
                            },
                            {
                                name: "search_inventory",
                                description: "Search products and movements by keyword.",
                                parameters: {
                                    type: "object",
                                    properties: {
                                        term: { type: "string", description: "Search keyword (product name, SKU, reference, partner)" }
                                    },
                                    required: ["term"]
                                }
                            },
                            {
                                name: "get_warehouses",
                                description: "List all available warehouse locations configured in the system.",
                                parameters: { type: "object", properties: {} }
                            },
                            {
                                name: "get_categories",
                                description: "List all product categories configured in the system.",
                                parameters: { type: "object", properties: {} }
                            },
                            {
                                name: "update_movement",
                                description: "Update an existing receipt, delivery, or transfer. Can change supplier/partner, quantity, location, or notes. Find by product name, reference ID, or type.",
                                parameters: {
                                    type: "object",
                                    properties: {
                                        movement_ref: { type: "string", description: "Product name, reference ID, or keyword to find the movement" },
                                        type: { type: "string", description: "Optional: filter by type (Receipt, Delivery, Transfer, Adjustment)" },
                                        new_partner: { type: "string", description: "New supplier or customer name" },
                                        new_qty: { type: "number", description: "Updated quantity" },
                                        new_location: { type: "string", description: "Updated location" },
                                        new_notes: { type: "string", description: "Additional notes" }
                                    },
                                    required: ["movement_ref"]
                                }
                            },
                            {
                                name: "reject_movement",
                                description: "Reject a pending receipt or movement. Marks it as Rejected and no stock change occurs.",
                                parameters: {
                                    type: "object",
                                    properties: {
                                        movement_ref: { type: "string", description: "Product name or reference ID of the movement to reject" }
                                    },
                                    required: ["movement_ref"]
                                }
                            },
                            {
                                name: "advance_delivery_stage",
                                description: "Advance a delivery order through its stages: Ready → Picking → Packing → Done (validated).",
                                parameters: {
                                    type: "object",
                                    properties: {
                                        movement_ref: { type: "string", description: "Product name or reference ID of the delivery" },
                                        target_stage: { type: "string", description: "Optional target stage: Picking, Packing, or Done" }
                                    },
                                    required: ["movement_ref"]
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
                const warehouses = await Storage.getWarehouses();
                const wh = warehouses.find(w => (typeof w === 'string' ? w : w.name).toLowerCase() === (args.location || '').toLowerCase());
                const whCode = (wh && wh.code) ? wh.code : ((args.location || 'WH').substring(0,4).toUpperCase());
                const seq = await Storage.getNextSequence(whCode, 'Receipt');
                await Storage.saveMovement({
                    id: seq,
                    type: 'Receipt',
                    productId: product.id,
                    productName: product.name,
                    quantity: Number(args.qty),
                    location: args.location,
                    partner: args.partner || 'Unknown Supplier',
                    status: 'Ready'
                });
                resultMsg = `✅ Created receipt ${seq} for ${args.qty} units of **${product.name}** at ${args.location}. Partner: ${args.partner || 'Unknown Supplier'}.`;
            } else if (name === 'create_delivery') {
                if (!product) throw new Error(`Product "${args.product_name}" not found.`);
                this.logProgress(`Creating delivery order for ${product.name}...`);
                const warehouses = await Storage.getWarehouses();
                const wh = warehouses.find(w => (typeof w === 'string' ? w : w.name).toLowerCase() === (args.location || '').toLowerCase());
                const whCode = (wh && wh.code) ? wh.code : ((args.location || 'WH').substring(0,4).toUpperCase());
                const seq = await Storage.getNextSequence(whCode, 'Delivery');
                // Reserve stock
                product.reserved = (Number(product.reserved) || 0) + Number(args.qty);
                await Storage.saveProduct(product);
                await Storage.saveMovement({
                    id: seq,
                    type: 'Delivery',
                    productId: product.id,
                    productName: product.name,
                    quantity: Number(args.qty),
                    location: args.location,
                    partner: args.partner || 'Customer',
                    status: 'Ready'
                });
                resultMsg = `✅ Created delivery order ${seq} for ${args.qty} units of **${product.name}** from ${args.location}. Customer: ${args.partner || 'Customer'}.`;
            } else if (name === 'create_transfer') {
                if (!product) throw new Error(`Product "${args.product_name}" not found.`);
                this.logProgress(`Moving stock from ${args.source} to ${args.dest}...`);
                const warehouses = await Storage.getWarehouses();
                const wh = warehouses.find(w => (typeof w === 'string' ? w : w.name).toLowerCase() === (args.source || '').toLowerCase());
                const whCode = (wh && wh.code) ? wh.code : ((args.source || 'WH').substring(0,4).toUpperCase());
                const seq = await Storage.getNextSequence(whCode, 'Transfer');
                await Storage.saveMovement({
                    id: seq,
                    type: 'Transfer',
                    productId: product.id,
                    productName: product.name,
                    quantity: Number(args.qty),
                    source: args.source,
                    location: args.dest,
                    status: 'Ready'
                });
                resultMsg = `✅ Created transfer ${seq} for ${args.qty} units of **${product.name}** from ${args.source} to ${args.dest}.`;
            } else if (name === 'create_adjustment') {
                if (!product) throw new Error(`Product "${args.product_name}" not found.`);
                this.logProgress(`Adjusting stock for ${product.name}...`);
                const prevStock = Number(product.stock);
                const warehouses = await Storage.getWarehouses();
                const wh = warehouses.find(w => (typeof w === 'string' ? w : w.name).toLowerCase() === (product.location || '').toLowerCase());
                const whCode = (wh && wh.code) ? wh.code : ((product.location || 'WH').substring(0,4).toUpperCase());
                const seq = await Storage.getNextSequence(whCode, 'Adjustment');
                await Storage.saveMovement({
                    id: seq,
                    type: 'Adjustment',
                    productId: product.id,
                    productName: product.name,
                    quantity: Number(args.qty),
                    actualQty: prevStock + Number(args.qty),
                    recordedQty: prevStock,
                    location: product.location,
                    reason: args.reason || 'Manual Adjustment',
                    partner: args.reason || 'Manual Adjustment',
                    status: 'Done'
                });
                product.stock = prevStock + Number(args.qty);
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
                const list = slice.map(m => {
                    const qty = m.quantity || m.qty || 0;
                    return `• ${m.date}: ${m.type} <strong>${m.productName}</strong> (${qty > 0 ? '+' : ''}${qty}) — ${m.status}`;
                }).join('<br>');
                resultMsg = `<strong>Recent Activity:</strong><br>${list}`;
            } else if (name === 'delete_product') {
                if (!product) throw new Error(`Product "${args.product_name}" not found in inventory.`);
                this.logProgress(`⚠️ Preparing to delete ${product.name}...`);
                // Show confirmation in UI before deleting
                const confirmed = window.confirm(`Are you sure you want to permanently delete "${product.name}" from inventory? This cannot be undone.`);
                if (!confirmed) {
                    statusDiv.remove();
                    resultMsg = `🚫 Deletion of **${product.name}** was cancelled.`;
                    this.addMessageToUI('bot', resultMsg);
                    this.messages.push({ role: "model", parts: [{ text: resultMsg }] });
                    this.saveHistory();
                    return;
                }
                this.logProgress(`Deleting ${product.name} (${product.id}) from database...`);
                await Storage.deleteProduct(product.id);
                resultMsg = `🗑️ Product **${product.name}** has been permanently deleted from inventory.`;
            } else if (name === 'update_product') {
                if (!product) throw new Error(`Product "${args.product_name}" not found.`);
                this.logProgress(`Updating ${product.name}...`);
                if (args.new_name) product.name = args.new_name;
                if (args.new_sku) product.sku = args.new_sku;
                if (args.new_category) product.category = args.new_category;
                if (args.new_location) product.location = args.new_location;
                if (args.new_stock !== undefined) product.stock = Number(args.new_stock);
                await Storage.saveProduct(product);
                resultMsg = `✅ Updated product **${product.name}** successfully.`;
            } else if (name === 'validate_movement') {
                this.logProgress(`Looking up movement: ${args.movement_ref}...`);
                const movements = await Storage.getMovements();
                const mv = movements.find(m =>
                    (m.id && m.id.toLowerCase().includes(args.movement_ref.toLowerCase())) ||
                    (m.productName && m.productName.toLowerCase().includes(args.movement_ref.toLowerCase()))
                );
                if (!mv) throw new Error(`No movement found for "${args.movement_ref}".`);
                if (mv.status === 'Done') {
                    resultMsg = `ℹ️ The movement for **${mv.productName}** is already validated (status: Done).`;
                } else {
                    this.logProgress(`Validating movement for ${mv.productName}...`);
                    mv.status = 'Done';
                    // Update stock quantity if receipt or delivery
                    const mvProduct = products.find(p => p.id === mv.productId || p.name === mv.productName);
                    if (mvProduct) {
                        const delta = mv.type === 'Receipt' ? Number(mv.qty) : (mv.type === 'Delivery' ? -Number(mv.qty) : 0);
                        mvProduct.stock = Number(mvProduct.stock || 0) + delta;
                        await Storage.saveProduct(mvProduct);
                    }
                    await Storage.saveMovement(mv);
                    resultMsg = `✅ **${mv.type}** for **${mv.productName}** (${mv.qty} units) has been validated and marked as Done.`;
                }
            } else if (name === 'get_products') {
                this.logProgress(`Fetching product list...`);
                let list = products;
                if (args.category) list = list.filter(p => p.category && p.category.toLowerCase().includes(args.category.toLowerCase()));
                if (args.location) list = list.filter(p => p.location && p.location.toLowerCase().includes(args.location.toLowerCase()));
                if (list.length === 0) {
                    resultMsg = `No products found${args.category ? ` in category "${args.category}"` : ''}${args.location ? ` at "${args.location}"` : ''}.`;
                } else {
                    const rows = list.map(p => `• **${p.name}** (${p.sku}) — Stock: ${p.stock || 0} — Location: ${p.location || 'N/A'}`).join('<br>');
                    resultMsg = `<strong>Products (${list.length}):</strong><br>${rows}`;
                }
            } else if (name === 'search_inventory') {
                this.logProgress(`Searching for "${args.term}"...`);
                const results = await Storage.searchAll(args.term);
                let msg = '';
                if (results.products.length > 0) {
                    const pRows = results.products.map(p => `• **${p.name}** (${p.sku}) — Stock: ${p.stock || 0}`).join('<br>');
                    msg += `<strong>Products:</strong><br>${pRows}<br>`;
                }
                if (results.movements.length > 0) {
                    const mRows = results.movements.map(m => `• ${m.date}: ${m.type} **${m.productName}** (${m.qty}) — ${m.status}`).join('<br>');
                    msg += `<strong>Movements:</strong><br>${mRows}`;
                }
                resultMsg = msg || `No results found for "${args.term}".`;
            } else if (name === 'get_warehouses') {
                this.logProgress(`Fetching warehouse list...`);
                const warehouses = await Storage.getWarehouses();
                const wList = warehouses.map(w => `• ${typeof w === 'string' ? w : w.name + (w.code ? ` (${w.code})` : '')}`).join('<br>');
                resultMsg = `<strong>Configured Warehouses & Locations:</strong><br>${wList}`;
            } else if (name === 'get_categories') {
                this.logProgress(`Fetching categories...`);
                const settings = await Storage.getSettings();
                const cats = settings.categories || [];
                resultMsg = `<strong>Product Categories:</strong><br>${cats.map(c => `• ${c}`).join('<br>')}`;
            } else if (name === 'update_movement') {
                this.logProgress(`Searching for movement: "${args.movement_ref}"...`);
                const movements = await Storage.getMovements();
                // Find the most recent matching movement
                const matches = movements.filter(m =>
                    (m.productName && m.productName.toLowerCase().includes(args.movement_ref.toLowerCase())) ||
                    (m.id && m.id.toLowerCase().includes(args.movement_ref.toLowerCase()))
                );
                // Optional type filter
                const filtered = args.type ? matches.filter(m => m.type && m.type.toLowerCase() === args.type.toLowerCase()) : matches;
                if (filtered.length === 0) throw new Error(`No movement found for "${args.movement_ref}"${args.type ? ` of type ${args.type}` : ''}.`);
                const mv = filtered[0]; // Most recent
                this.logProgress(`Updating ${mv.type} for ${mv.productName}...`);
                if (args.new_partner) mv.partner = args.new_partner;
                if (args.new_qty !== undefined) mv.qty = Number(args.new_qty);
                if (args.new_location) mv.location = args.new_location;
                if (args.new_notes) mv.notes = args.new_notes;
                await Storage.saveMovement(mv);
                resultMsg = `✅ Updated **${mv.type}** for **${mv.productName}**. New details — Partner: ${mv.partner || 'N/A'}, Qty: ${mv.qty}, Location: ${mv.location}.`;
            } else if (name === 'reject_movement') {
                this.logProgress(`Searching for movement to reject: "${args.movement_ref}"...`);
                const movements = await Storage.getMovements();
                const mv = movements.find(m =>
                    (m.productName && m.productName.toLowerCase().includes(args.movement_ref.toLowerCase())) ||
                    (m.id && m.id.toLowerCase().includes(args.movement_ref.toLowerCase()))
                );
                if (!mv) throw new Error(`No movement found for "${args.movement_ref}".`);
                if (mv.status === 'Done') throw new Error(`Cannot reject a movement that is already validated (Done).`);
                if (mv.status === 'Rejected') {
                    resultMsg = `ℹ️ The movement for **${mv.productName}** is already Rejected.`;
                } else {
                    this.logProgress(`Rejecting ${mv.type} for ${mv.productName}...`);
                    mv.status = 'Rejected';
                    await Storage.saveMovement(mv);
                    resultMsg = `❌ **${mv.type}** for **${mv.productName}** has been rejected.`;
                }
            } else if (name === 'advance_delivery_stage') {
                this.logProgress(`Looking up delivery: "${args.movement_ref}"...`);
                const movements = await Storage.getMovements();
                const mv = movements.find(m =>
                    m.type === 'Delivery' &&
                    ((m.productName && m.productName.toLowerCase().includes(args.movement_ref.toLowerCase())) ||
                    (m.id && m.id.toLowerCase().includes(args.movement_ref.toLowerCase())))
                );
                if (!mv) throw new Error(`No delivery found for "${args.movement_ref}".`);
                const stageMap = { 'Ready': 'Picking', 'Picking': 'Packing', 'Packing': 'Done' };
                const nextStage = args.target_stage || stageMap[mv.status];
                if (!nextStage) throw new Error(`Delivery is already in final stage: ${mv.status}.`);
                if (nextStage === 'Done') {
                    // Full validation — reduce stock, release reservation
                    const mvProduct = products.find(p => p.id === mv.productId || p.name === mv.productName);
                    if (mvProduct) {
                        const qty = Number(mv.quantity || mv.qty || 0);
                        mvProduct.stock = Number(mvProduct.stock) - qty;
                        mvProduct.reserved = Math.max(0, (Number(mvProduct.reserved) || 0) - qty);
                        await Storage.saveProduct(mvProduct);
                    }
                } 
                this.logProgress(`Advancing delivery to ${nextStage}...`);
                mv.status = nextStage;
                await Storage.saveMovement(mv);
                resultMsg = `✅ Delivery for **${mv.productName}** advanced to **${nextStage}**.`;
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
        if (userId && userId !== 'guest') {
            Storage.saveAIChatHistory({ messages: [], model: this.currentModel, timestamp: Date.now() }).catch(e => console.error(e));
        }
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