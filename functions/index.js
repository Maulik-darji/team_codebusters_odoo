const functions = require("firebase-functions");

const GEMINI_API_KEY = "AIzaSyB8HywYzk0rDAFn5jTu3xb-1q1GY5nLQ-c";
const MODEL = "gemini-1.5-flash"; 

exports.askAI = functions.https.onRequest(async (req, res) => {
    // Robust Manual CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method === 'GET') {
        res.status(200).send("AI Assistant Backend is Live!");
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    try {
        const modelToUse = req.body.model || MODEL;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${GEMINI_API_KEY}`;
        
        const body = { ...req.body };
        delete body.model;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error("Gemini Proxy Error:", error);
        res.status(500).json({ error: error.message });
    }
});




