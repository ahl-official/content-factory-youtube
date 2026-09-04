const aiModels = require('../../config/aiModels');
const logger = require('../../logger');

// Hardcoded static fallback mappings via aiModels config to avoid unstable Google preview strings
function getModelPool(requestedModel) {
    if (requestedModel) {
        return [requestedModel]; // Strictly trust the model requested by the router
    }

    // Default mapped for unknown requests
    return [aiModels.gemini.fast];
}

async function executeGeminiRequest(modelId, sysPrompt, userPrompt, maxTokens, temperature) {
    const apiKey = process.env.GEMINI_API_KEY;
    const fetch = (await import('node-fetch')).default;
    const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

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
                { role: "user", parts: [{ text: userPrompt }] }
            ],
            generationConfig: {
                responseMimeType: "application/json",
                temperature: temperature || 0.7,
                maxOutputTokens: maxTokens || 2048
            }
        })
    });

    if (!res.ok) {
        const errText = await res.text();
        throw { status: res.status, message: errText };
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    return {
        responseText: candidate?.content?.parts?.[0]?.text || '',
        finishReason: (candidate?.finishReason === 'RECITATION' || candidate?.finishReason === 'MAX_TOKENS') ? 'length' : 'stop'
    };
}

async function generate({ agentId, model, sysPrompt, userPrompt, maxTokens, temperature }) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('PROVIDER_ERROR: NO_API_KEY');
    }

    const targetPool = getModelPool(model);

    const currentModelId = targetPool[0];
    logger.info(`[Gemini Service] Attempting Agent: ${agentId || 'Unknown'} dynamically with model: ${currentModelId}`);

    try {
        const result = await executeGeminiRequest(currentModelId, sysPrompt, userPrompt, maxTokens, temperature);
        return {
            responseText: result.responseText,
            finishReason: result.finishReason,
            provider: 'gemini',
            model: currentModelId
        };
    } catch (err) {
        logger.warn(`[Gemini Service] Agent: ${agentId || 'Unknown'} Model: ${currentModelId} Failed (${err.status})`);

        if (err.status === 429 || (err.message && err.message.toLowerCase().includes('quota'))) {
            throw new Error(`PROVIDER_ERROR: QUOTA_EXHAUSTED`);
        }

        // Exhausted pool or unrecoverable non-retryable error
        throw new Error(`PROVIDER_ERROR: HTTP_${err.status}`);
    }

    // 6. Graceful fallback error (handled by modelRouter to fallback to OpenRouter)
    throw new Error('PROVIDER_ERROR: EXHAUSTED_ALL_MODELS');
}

module.exports = { generate, getModelPool };
