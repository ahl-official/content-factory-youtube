const { config } = require('dotenv');
config();
const fetch = require('node-fetch');
const logger = require('../../logger');

// DeepSeek provides highly intelligent JSON generation for an incredibly low price / high free quota.
// Recommended model: 'deepseek-chat' (DeepSeek-V2.5) or 'deepseek-coder'
const modelPools = {
    default: ['deepseek-chat']
};

async function inferWithDeepseek(sysPrompt, userPrompt, requestedModel, maxTokens = 1500, temperature = 0.7) {
    const currentModelId = requestedModel && requestedModel.includes('deepseek') ? requestedModel : modelPools.default[0];

    try {
        const res = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
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
            logger.warn(`[DeepSeek Service] Rate Limit (429) hit on Model: ${currentModelId}`);
            throw new Error(`PROVIDER_ERROR: DEEPSEEK_QUOTA_EXHAUSTED`); // Will failover via modelRouter
        }

        throw new Error(`DeepSeek API Exception: ${err.message || JSON.stringify(err)}`);
    }
}

module.exports = { inferWithDeepseek };
