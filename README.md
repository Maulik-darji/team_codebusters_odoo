# StockPilot IMS 🚀

**StockPilot** is a modern, AI-powered Inventory Management System (IMS) designed to streamline warehouse operations. It provides real-time tracking of stock levels, automated movement workflows, and an intelligent AI assistant that can execute complex inventory tasks through natural language.

---

## 🛠️ Tech Stack

### Frontend
- **HTML5 & Vanilla CSS**: Clean, responsive UI with a custom design system.
- **JavaScript (ES6+)**: Modular architecture for maintainable and scalable frontend logic.
- **Lucide Icons**: For sharp, modern visual elements.
- **Single Page Feel**: Dynamic content loading and modular component injection.

### Backend & Infrastructure
- **Firebase Authentication**: Secure user login and signup workflows.
- **Cloud Firestore**: Real-time NoSQL database for product data, movement ledgers, and chat history.
- **Firebase Cloud Functions**: Serverless backend for secure AI API proxying and data validation.
- **Firebase Hosting**: Fast and secure global CDN for the web application.

### Artificial Intelligence
- **Google Gemini Pro (1.5 Flash)**: Powering the StockPilot AI assistant.
- **Function Calling (Tool Use)**: The AI is directly integrated into the system's storage layer, enabling it to:
  - Create/Update/Delete products.
  - Process Receipts, Deliveries, and Transfers.
  - Search and summarize inventory data.

---

## ✨ Key Features

### 📊 Real-Time Dashboard
- **KPI Monitoring**: Instant visibility into Total Stock, Low Stock (alerts), and Pending Operations.
- **Movement Ledger**: A comprehensive, filterable audit trail of every stock change (In/Out/Move/Adjust).

### 📦 Comprehensive Inventory Control
- **Product Management**: Full CRUD capabilities with SKU tracking, categorization, and location mapping.
- **Smart Workflows**:
  - **Receipts**: Track incoming stock from suppliers.
  - **Deliveries**: 4-stage outgoing workflow (Ready → Picking → Packing → Done).
  - **Transfers**: Seamlessly move stock between different warehouse locations.
  - **Adjustments**: Log manual corrections with reason tracking.

### 🤖 StockPilot AI Assistant
- **Natural Language Interaction**: Manage your entire warehouse by simply chatting with the AI.
- **Proactive Validation**: The AI asks for missing information (like SKU or Location) before taking action, ensuring data integrity.
- **Secure Persistence**: Chat history is synced across devices via Firestore, with built-in API key protection.

### 🔐 Security & Multi-Tenancy
- **User-Specific Data**: Products and movements are scoped to individual users/organizations.
- **Secure Backend**: Critical AI interactions are proxied through server-side functions to keep API keys hidden from the client side.

---

## 📁 Project Structure

```text
├── functions/              # Firebase Cloud Functions (Backend)
├── js/                     # Frontend Application Logic
│   ├── ai-assistant.js     # Gemini Integration & Tool Handling
│   ├── storage.js          # Firestore CRUD & Operations Logic
│   ├── auth.js             # Authentication Management
│   └── app.js              # UI Component Injection & Lifecycle
├── css/                    # Custom CSS Design System
├── index.html              # Dashboard Interface
├── products.html           # Product Management Page
├── receipts.html           # Incoming Shipment Management
├── delivery.html           # Outgoing Shipment Workflows
└── ...                     # Additional Management Interfaces
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js & NPM
- Firebase CLI (`npm install -g firebase-tools`)
- Google Gemini API Key

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd stockpilot
   ```

2. **Backend Setup**:
   ```bash
   cd functions
   npm install
   # Create a .env file with your GEMINI_API_KEY
   echo "GEMINI_API_KEY=your_key_here" > .env
   ```

3. **Frontend Configuration**:
   Update `js/firebase-config.js` with your Firebase project credentials.

4. **Run Locally**:
   ```bash
   firebase serve
   # or simply open index.html using a local server extension (e.g., Live Server)
   ```

---

## 📝 For Resume: Key Highlights

- **AI-Driven Automation**: Built an intelligent assistant using Gemini Pro that performs real-time database operations via Function Calling, reducing manual inventory entry time.
- **Full-Stack Firebase Integration**: Leveraged Firestore for real-time data syncing, Cloud Functions for secure server-side logic, and Auth for secure user management.
- **Complex State Workflows**: Implemented a multi-stage delivery pipeline ensuring stock accuracy through reservation and validation stages.
- **Modular Frontend Architecture**: Developed a decoupled frontend using ES6 modules, separating storage logic from UI components for better maintainability.
