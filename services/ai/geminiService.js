const aiModels = require('../../config/aiModels');
const logger = require('../../logger');

// Startup validation of configured Gemini models
(async function validateGeminiModel() {
    if (!process.env.GEMINI_API_KEY) return;
    const configuredModels = Object.values(aiModels.gemini);

    logger.info(`[Gemini Service] Startup Validation: Checking active models -> ${configuredModels.join(', ')}`);

    try {
        const fetch = (await import('node-fetch')).default;
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        if (res.ok) {
            const body = await res.json();
            const availableGoogleModels = body.models || [];

            configuredModels.forEach(modelTarget => {
                const exists = availableGoogleModels.some(m => m.name === `models/${modelTarget}` || m.name === modelTarget);
                if (!exists) {
                    logger.warn(`[Gemini Service] Startup Warning: Model unavailable via API - ${modelTarget}. Check configuration or permissions.`);
                }
            });
        }
    } catch (e) {
        logger.warn(`[Gemini Service] Startup Warning: Could not validate models due to network error.`);
    }
})();

async function generate({ agentId, model, sysPrompt, userPrompt, maxTokens, temperature, attempts }) {
    // Validate model before hitting API
    const validGeminiModels = Object.values(aiModels.gemini);

    // Check if the requested model matches the config, or if a global deprecation check fails
    if (!validGeminiModels.includes(model)) {
        logger.error(`[Gemini Service] Agent: ${agentId || 'Unknown'} Model: ${model} Status: INVALID_MODEL Action: Fallback`);
        throw new Error('PROVIDER_ERROR: INVALID_MODEL');
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API key is missing');

    const fetch = (await import('node-fetch')).default;

    // Convert model to API endpoint
    const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            systemInstruction: {
                parts: [{ text: sysPrompt + '\n\nYou must respond in strict JSON format matching the required schema.' }]
            },
            contents: [
                {
                    role: "user",
                    parts: [{ text: userPrompt }]
                }
            ],
            generationConfig: {
                responseMimeType: "application/json",
                temperature: temperature,
                maxOutputTokens: maxTokens
            }
        })
    });

    if (!res.ok) {
        const errText = await res.text();
        logger.error(`[Gemini Service] Agent: ${agentId || 'Unknown'} Provider: gemini Model: ${model} API Response Status: ${res.status}`);
        if (res.status === 429 || errText.toLowerCase().includes('quota')) {
            throw new Error(`Gemini Quota Exhausted (429 Rate Limit): ${errText}`);
        }
        throw new Error(`Gemini API Error: ${res.status} ${errText}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const responseText = candidate?.content?.parts?.[0]?.text;
    let finishReason = candidate?.finishReason;
    if (finishReason === 'RECITATION' || finishReason === 'MAX_TOKENS') {
        finishReason = 'length';
    } else {
        finishReason = 'stop';
    }

    logger.info(`[Gemini Service] Agent: ${agentId || 'Unknown'} Provider: gemini Model: ${model} API Response Status: ${res.status} (Success)`);

    return { responseText, finishReason, provider: 'gemini', model };
}

module.exports = { generate };
