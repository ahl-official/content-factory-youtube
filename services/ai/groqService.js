const { config } = require('dotenv');
config();
const fetch = require('node-fetch');
const logger = require('../../logger');

// Groq Free Tier limits are strict (often 30 RPM, but small Context Windows ~8k)
// Groq excels at reasoning, logic, and extreme speed (300 tokens/sec).
const modelPools = {
    fast: ['llama-3.1-8b-instant'],
    reasoning: ['llama-3.1-70b-versatile'],
    json: ['llama-3.1-8b-instant'] // Llama 3 handles JSON beautifully natively
};

function getModelPool(requestedModel) {
    if (requestedModel.includes('70b') || requestedModel === 'groq-reasoning') {
        return modelPools.reasoning;
    }
    return modelPools.fast;
}

async function inferWithGroq(sysPrompt, userPrompt, requestedModel, maxTokens = 1500, temperature = 0.7) {
    const targetPool = getModelPool(requestedModel);

    // We do NOT use automatic looping here because we disabled mathematical retries per the user's request!
    // We will just try the first model in the target pool.
    const currentModelId = targetPool[0];

    try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: currentModelId,
                messages: [
                    { role: "system", content: sysPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: temperature,
                max_tokens: maxTokens,
                response_format: { type: "json_object" }
            })
        });

        if (!res.ok) {
            const errText = await res.text();
            throw { status: res.status, message: errText };
        }

        const data = await res.json();
        const content = data.choices[0]?.message?.content || "";
        const finishReason = data.choices[0]?.finish_reason;

        return { content, finishReason, modelUsed: currentModelId };

    } catch (err) {
        if (err.status === 429 || (err.message && err.message.toLowerCase().includes('rate limit'))) {
            logger.warn(`[Groq Service] Rate Limit (429) hit on Model: ${currentModelId}`);
            throw new Error(`PROVIDER_ERROR: GROQ_QUOTA_EXHAUSTED`); // Will failover via modelRouter
        }

        throw new Error(`Groq API Exception: ${err.message || JSON.stringify(err)}`);
    }
}

module.exports = { inferWithGroq };
