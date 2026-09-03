const config = require('../../config');
const ytConfig = require('../../youtube/youtubeAgentsConfig');

async function generate({ model, sysPrompt, userPrompt, maxTokens, temperature, attempts }) {
    const apiKey = process.env.OPENROUTER_API_KEY_YT;
    if (!apiKey) throw new Error('YouTube OpenRouter API key (OPENROUTER_API_KEY_YT) is missing. Set it in .env');

    const fetch = (await import('node-fetch')).default;
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'YouTube AI Agents'
        },
        body: JSON.stringify({
            model: model,
            temperature: temperature,
            max_tokens: maxTokens,
            response_format: { type: "json_object" },
            messages: [
                { role: 'system', content: sysPrompt + '\n\nYou must respond in strict JSON format matching the required schema.' },
                { role: 'user', content: userPrompt }
            ]
        })
    });

    if (!res.ok) {
        const errText = await res.text();
        if (res.status === 429 || errText.toLowerCase().includes('quota')) {
            throw new Error(`OpenRouter Quota Exhausted (429 Rate Limit): ${errText}`);
        }
        throw new Error(`OpenRouter API Error: ${res.status} ${errText}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    const responseText = choice?.message?.content;
    const finishReason = choice?.finish_reason;

    return { responseText, finishReason, provider: 'openrouter', model };
}

module.exports = { generate };
