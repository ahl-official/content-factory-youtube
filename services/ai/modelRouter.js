const openRouterService = require('./openRouterService');
const geminiService = require('./geminiService');
const groqService = require('./groqService');
const deepseekService = require('./deepseekService');
const agentModels = require('../../config/agentModels');
const logger = require('../../logger');
const aiModels = require('../../config/aiModels');

const providerHealth = {
    gemini: { consecutiveFailures: 0, lastFailureTs: 0 },
    openrouter: { consecutiveFailures: 0, lastFailureTs: 0 },
    groq: { consecutiveFailures: 0, lastFailureTs: 0 },
    deepseek: { consecutiveFailures: 0, lastFailureTs: 0 }
};

function recordFailure(provider) {
    if (!providerHealth[provider]) return;
    providerHealth[provider].consecutiveFailures += 1;
    providerHealth[provider].lastFailureTs = Date.now();
}

function recordSuccess(provider) {
    if (!providerHealth[provider]) return;
    providerHealth[provider].consecutiveFailures = 0;
}

function getRoutingSequence(primaryConfig) {
    // Alternative 1: Strict 1-to-1 Routing (No Fallsbacks)
    return [{ provider: primaryConfig.provider, model: primaryConfig.model }];
}

async function routeGeneration({ agentId, sysPrompt, userPrompt, maxTokens, temperature, attempts, validateFn }) {
    const config = agentModels[agentId.toString()];

    if (!config) {
        throw new Error(`No provider config found for agent ${agentId}`);
    }

    // Globally enforce rigid JSON structure to prevent markdown leakage or array roots
    const strictFormatRule = "\n\nYou MUST return only JSON. Do not return markdown. Do not return explanation. The root must be an object, not an array.";
    const finalSysPrompt = sysPrompt + strictFormatRule;

    const sequence = getRoutingSequence(config);
    let lastError = null;

    for (let i = 0; i < sequence.length; i++) {
        const { provider, model } = sequence[i];

        try {
            let result;
            if (provider === 'gemini') {
                result = await geminiService.generate({ agentId, model, sysPrompt: finalSysPrompt, userPrompt, maxTokens, temperature, attempts });
            } else if (provider === 'groq') {
                // For custom baremetal scripts
                const groqOutput = await groqService.inferWithGroq(finalSysPrompt, userPrompt, model, maxTokens, temperature);
                result = { responseText: groqOutput.content, finishReason: groqOutput.finishReason };
            } else if (provider === 'deepseek') {
                const dsOutput = await deepseekService.inferWithDeepseek(finalSysPrompt, userPrompt, model, maxTokens, temperature);
                result = { responseText: dsOutput.content, finishReason: dsOutput.finishReason };
            } else {
                result = await openRouterService.generate({ agentId, model, sysPrompt: finalSysPrompt, userPrompt, maxTokens, temperature, attempts });
            }

            if (!result.responseText || !result.responseText.trim()) {
                throw new Error('EMPTY_RESPONSE');
            }

            let parsed = null;
            if (validateFn) {
                parsed = validateFn(result.responseText);
            }

            recordSuccess(provider);

            return {
                ...result,
                parsed,
                provider,
                model
            };
        } catch (err) {
            recordFailure(provider);

            const isTimeout = err.message.includes('timeout') || err.message.includes('ECONNRESET');
            const isEmpty = err.message === 'EMPTY_RESPONSE';
            const isInvalidJson = err.message.includes('INVALID_JSON') || err.message.includes('SCHEMA_VALIDATION_FAILED');
            const isQuota = err.message.includes('429');

            let status = 'PROVIDER_ERROR';
            if (isTimeout) status = 'TIMEOUT';
            if (isEmpty) status = 'EMPTY_RESPONSE';
            if (isInvalidJson) status = 'INVALID_JSON';
            if (isQuota) status = 'QUOTA_EXHAUSTED';

            const nextTarget = i < sequence.length - 1 ? `${sequence[i + 1].provider} (${sequence[i + 1].model})` : 'None (Exhausted)';

            logger.error(`[AI Router] Agent: ${agentId} Attempted Provider: ${provider} Attempted Model: ${model} Status: ${status} Failure Reason: ${err.message} Fallback Provider Selected: ${nextTarget}`);

            err.latestProvider = provider;
            err.latestModel = model;
            lastError = err;

            // Stop waterfall if the provider responded successfully but output failed format checks
            if (isInvalidJson || isEmpty) {
                logger.warn(`[AI Router] Stopping waterfall. Provider ${provider} responded but failed format validation. Throwing for internal retry.`);
                throw err;
            }
        }
    }

    throw new Error(`All providers exhausted. Final failure -> Provider: ${lastError.latestProvider} Model: ${lastError.latestModel} Reason: ${lastError.message}`);
}

module.exports = { routeGeneration };
