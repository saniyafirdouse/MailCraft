const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MAX_RETRIES = 2;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGroq(prompt, attempt = 1) {
    if (!GROQ_API_KEY) {
        const err = new Error('Groq API authorization key is not configured.');
        err.statusCode = 500;
        throw err;
    }

    try {
        const response = await fetch(GROQ_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [
                    { 
                        role: "system", 
                        content: "You are a specialized enterprise email workspace intelligence asset. You only communicate and respond in structured, clean JSON objects as strictly commanded by the user prompts. Never include markdown fences or explanation conversations." 
                    },
                    { role: "user", content: prompt }
                ],
                // Activating strict dynamic JSON formatting configuration enforcement modes on Groq
                response_format: { type: "json_object" },
                temperature: 0.2,
                max_tokens: 2048
            }),
        });

        if (!response.ok) {
            const isRetryable = response.status === 429 || response.status >= 500;
            if (isRetryable && attempt <= MAX_RETRIES) {
                await sleep(500 * attempt);
                return callGroq(prompt, attempt + 1);
            }
            const errBody = await response.text();
            const err = new Error(`Groq Engine Error (${response.status}): ${errBody.slice(0, 200)}`);
            err.statusCode = 502;
            throw err;
        }

        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;

        if (!text) {
            const err = new Error('Groq API engine parsed an empty block response state.');
            err.statusCode = 502;
            throw err;
        }

        return text;
    } catch (err) {
        if (attempt <= MAX_RETRIES && !err.statusCode) {
            await sleep(500 * attempt);
            return callGroq(prompt, attempt + 1);
        }
        throw err;
    }
}

async function callGeminiJSON(prompt) {
    const raw = await callGroq(prompt);
    // Dynamic cleansing just in case formatting skips a logic parameter
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
        return JSON.parse(cleaned);
    } catch (parseErr) {
        const err = new Error('Failed to synchronize and parse Groq text formatting into valid structural JSON.');
        err.statusCode = 502;
        throw err;
    }
}

// Keeping export name matching the controller layout mapping signatures seamlessly
module.exports = { callGemini: callGroq, callGeminiJSON };