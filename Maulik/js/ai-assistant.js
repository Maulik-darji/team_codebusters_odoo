import Storage from './storage.js';

const GEMINI_API_KEY = 'AIzaSyBNMw4ljnf-CMKFgG7jsO5CLcXNESMMdC0';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

const AIAssistant = {
    messages: [],
    
    async init() {
        const input = document.getElementById('ai-input');
        const sendBtn = document.getElementById('ai-send');
        
        if (!input || !sendBtn) return;

        sendBtn.onclick = () => this.handleSendMessage();
        input.onkeypress = (e) => {
            if (e.key === 'Enter') this.handleSendMessage();
        };

        // System prompt
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
    },

    async handleSendMessage() {
        const input = document.getElementById('ai-input');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        this.addMessageToUI('user', text);
        
        this.messages.push({ role: "user", parts: [{ text }] });
        
        try {
            await this.callGemini();
        } catch (err) {
            this.addMessageToUI('bot', "Sorry, I'm having trouble connecting right now. " + err.message);
        }
    },

    async callGemini() {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: this.messages,
                tools: [{
                    function_declarations: [
                        {
                            name: "create_product",
                            description: "Add a new product to the inventory catalog",
                            parameters: {
                                type: "object",
                                properties: {
                                    name: { type: "string", description: "Product name" },
                                    sku: { type: "string", description: "Unique SKU code" },
                                    category: { type: "string", description: "Product category (e.g. soap, electronics)" },
                                    stock: { type: "number", description: "Initial stock level" },
                                    location: { type: "string", description: "Default warehouse/location" }
                                },
                                required: ["name", "sku", "category", "stock", "location"]
                            }
                        },
                        {
                            name: "create_receipt",
                            description: "Process an incoming shipment of goods",
                            parameters: {
                                type: "object",
                                properties: {
                                    product_name: { type: "string", description: "Name of the product to receive" },
                                    qty: { type: "number", description: "Quantity received" },
                                    location: { type: "string", description: "Warehouse location" },
                                    partner: { type: "string", description: "Vendor or supplier name" }
                                },
                                required: ["product_name", "qty", "location", "partner"]
                            }
                        },
                        {
                            name: "create_delivery",
                            description: "Process an outgoing shipment to a customer",
                            parameters: {
                                type: "object",
                                properties: {
                                    product_name: { type: "string", description: "Name of product" },
                                    qty: { type: "number", description: "Quantity to ship" },
                                    location: { type: "string", description: "Source warehouse" },
                                    partner: { type: "string", description: "Customer name" }
                                },
                                required: ["product_name", "qty", "location", "partner"]
                            }
                        },
                        {
                            name: "create_transfer",
                            description: "Move stock between two internal locations",
                            parameters: {
                                type: "object",
                                properties: {
                                    product_name: { type: "string", description: "Name of product" },
                                    qty: { type: "number", description: "Quantity to move" },
                                    source: { type: "string", description: "Source location" },
                                    dest: { type: "string", description: "Destination location" }
                                },
                                required: ["product_name", "qty", "source", "dest"]
                            }
                        },
                        {
                            name: "get_recent_history",
                            description: "Show recent stock movements",
                            parameters: { type: "object", properties: { limit: { type: "number" } } }
                        },
                        {
                            name: "create_adjustment",
                            description: "Manually adjust the stock level of a product (positive or negative)",
                            parameters: {
                                type: "object",
                                properties: {
                                    product_name: { type: "string" },
                                    qty: { type: "number", description: "Adjustment amount. Positive to add, negative to remove." },
                                    reason: { type: "string" }
                                },
                                required: ["product_name", "qty", "reason"]
                            }
                        }
                    ]
                }]
            })
        });

        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error.message);
        }

        const candidate = result.candidates[0];
        const content = candidate.content;

        if (content.parts[0].functionCall) {
            const fc = content.parts[0].functionCall;
            await this.handleToolCall(fc);
        } else {
            const botText = content.parts[0].text;
            this.addMessageToUI('bot', botText);
            this.messages.push({ role: "model", parts: [{ text: botText }] });
        }
    },

    async handleToolCall(fc) {
        const name = fc.name;
        const args = fc.args;
        let resultMsg = "";

        this.addMessageToUI('bot', `<div class="ai-tool-call">System Executing: ${name}...</div>`);

        try {
            const products = await Storage.getProducts();
            const product = (args.product_name) ? products.find(p => p.name.toLowerCase().includes(args.product_name.toLowerCase())) : null;

            if (name === 'create_product') {
                await Storage.saveProduct({
                    id: 'PROD-' + Date.now(),
                    name: args.name,
                    sku: args.sku,
                    category: args.category,
                    stock: args.stock || 0,
                    location: args.location,
                    ownerId: Storage.getUid()
                });
                resultMsg = `✅ Successfully added product: ${args.name} (${args.sku}).`;
            } else if (name === 'create_receipt') {
                if (!product) throw new Error(`Product "${args.product_name}" not found.`);
                await Storage.saveMovement({
                    type: 'Receipt',
                    productId: product.id,
                    productName: product.name,
                    qty: args.qty,
                    location: args.location,
                    partner: args.partner,
                    status: 'Ready'
                });
                resultMsg = `✅ Created receipt for ${args.qty} units of ${product.name} at ${args.location}.`;
            } else if (name === 'create_delivery') {
                if (!product) throw new Error(`Product "${args.product_name}" not found.`);
                await Storage.saveMovement({
                    type: 'Delivery',
                    productId: product.id,
                    productName: product.name,
                    qty: args.qty,
                    location: args.location,
                    partner: args.partner,
                    status: 'Ready'
                });
                resultMsg = `✅ Created delivery order for ${args.qty} units of ${product.name} from ${args.location}.`;
            } else if (name === 'create_transfer') {
                if (!product) throw new Error(`Product "${args.product_name}" not found.`);
                await Storage.saveMovement({
                    type: 'Transfer',
                    productId: product.id,
                    productName: product.name,
                    qty: args.qty,
                    sourceLocation: args.source,
                    location: args.dest,
                    status: 'Ready'
                });
                resultMsg = `✅ Created transfer for ${args.qty} units of ${product.name} from ${args.source} to ${args.dest}.`;
            } else if (name === 'create_adjustment') {
                if (!product) throw new Error(`Product "${args.product_name}" not found.`);
                await Storage.saveMovement({
                    type: 'Adjustment',
                    productId: product.id,
                    productName: product.name,
                    qty: args.qty,
                    location: product.location,
                    partner: args.reason || 'Manual Adjustment',
                    status: 'Done'
                });
                // Update product stock directly for adjustments
                product.stock = Number(product.stock) + Number(args.qty);
                await Storage.saveProduct(product);
                resultMsg = `✅ Adjusted ${product.name} stock by ${args.qty}. New stock: ${product.stock}.`;
            } else if (name === 'get_inventory_status') {
                const summary = products.map(p => `• ${p.name}: ${p.stock}`).join('<br>');
                resultMsg = `<strong>Current Stock:</strong><br>${summary}`;
            } else if (name === 'get_recent_history') {
                const movements = await Storage.getMovements();
                const slice = movements.slice(0, args.limit || 5);
                const list = slice.map(m => `• ${m.date}: ${m.type} ${m.productName} (${m.qty > 0 ? '+' : ''}${m.qty})`).join('<br>');
                resultMsg = `<strong>Recent Activity:</strong><br>${list}`;
            }

            this.addMessageToUI('bot', resultMsg);
            this.messages.push({ role: "model", parts: [{ text: resultMsg }] });
            
            // Re-render dashboard or lists if visible
            window.dispatchEvent(new CustomEvent('auth-ready')); 
        } catch (err) {
            this.addMessageToUI('bot', `<span style="color: var(--danger)">❌ Action failed: ${err.message}</span>`);
        }
    },

    addMessageToUI(role, text) {
        const container = document.getElementById('ai-chat-messages');
        const div = document.createElement('div');
        div.className = `ai-msg ${role}`;
        div.innerHTML = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }
};

export default AIAssistant;
