const aiModels = require('../../config/aiModels');
const logger = require('../../logger');

let activeGeminiModels = [];
let modelPools = {
    fast: [],
    reasoning: [],
    transcription: []
};

// 1. Startup validation and dynamic fetching
(async function initializeGeminiResolver() {
    if (!process.env.GEMINI_API_KEY) return;

    try {
        const fetch = (await import('node-fetch')).default;
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        if (res.ok) {
            const body = await res.json();

            // 2. Filter valid models supporting generateContent
            const validModels = (body.models || [])
                .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
                .map(m => m.name.replace('models/', ''));

            activeGeminiModels = validModels;

            // 3. Capability Mapping (Dynamically pick best model matching strings)
            // Prioritize standard models over preview/experimental if possible by sorting length or names,
            // but for simplicity, we just filter by keywords. Newer models typically appear later or we can reverse.
            const preferredOrder = validModels.reverse();

            modelPools.fast = preferredOrder.filter(m => m.includes('lite') || m.includes('nano') || m.includes('fast') || (m.includes('flash') && !m.includes('pro')));
            modelPools.reasoning = preferredOrder.filter(m => m.includes('pro') || m.includes('advanced') || m.includes('flash'));
            modelPools.transcription = preferredOrder.filter(m => m.includes('flash') && !m.includes('lite')); // heavy flash typically handles audio better

            // Fallback to any valid generateContent model if filters are too strict
            if (modelPools.fast.length === 0) modelPools.fast = preferredOrder;
            if (modelPools.reasoning.length === 0) modelPools.reasoning = preferredOrder;
            if (modelPools.transcription.length === 0) modelPools.transcription = preferredOrder;

            logger.info(`[Gemini Dynamic Resolver] Active. Pools -> Fast: ${modelPools.fast.length}, Reasoning: ${modelPools.reasoning.length}, Transcribe: ${modelPools.transcription.length}`);
        }
    } catch (e) {
        // 5. Never expose errors to frontend
        logger.warn(`[Gemini Dynamic Resolver] Silent network failure during initialization. Using standard static fallbacks.`);
    }
})();

function getModelPool(requestedModel) {
    // If the requested model implies "fast" or "flash", route to the dynamically validated fast pool
    if (requestedModel.includes('flash') || requestedModel === 'gemini-fast' || requestedModel === 'fast') {
        return modelPools.fast.length > 0 ? modelPools.fast : ['gemini-1.5-flash', 'gemini-1.5-flash-8b'];
    }

    if (requestedModel === 'gemini-transcription') {
        return modelPools.transcription.length > 0 ? modelPools.transcription : ['gemini-1.5-flash'];
    }

    // Default mapped for gemini-reasoning, 'pro', or unknown requests
    return modelPools.reasoning.length > 0 ? modelPools.reasoning : ['gemini-1.5-pro', 'gemini-1.5-flash'];
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
