const ytConfig = require('../../youtube/youtubeAgentsConfig');
const logger = require('../../logger');
const { routeGeneration } = require('./modelRouter');

function extractJsonRobustly(text) {
    if (!text || !text.trim()) {
        throw new Error("EMPTY_RESPONSE");
    }

    // 1. Remove markdown completely
    let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    // 2. Remove common prefixes before the actual JSON starts
    cleaned = cleaned.replace(/^(Output|Retention Review Output|Here is the JSON:?|JSON output:?|Final Output:?)\s*/i, '');

    // 3. We attempt to find the first '{' and parse iteratively, 
    // because there could be garbage strings before the block, e.g. "Some text { "x": 1 }"
    const tryParse = (str) => {
        try { return JSON.parse(str); } catch (e) { return null; }
    };

    let startBrace = cleaned.indexOf('{');
    let startBracket = cleaned.indexOf('[');

    // Pick whichever comes first, assuming the root is either object or array
    let firstCharIdx = -1;
    let isObject = true;
    if (startBrace !== -1 && (startBracket === -1 || startBrace < startBracket)) {
        firstCharIdx = startBrace;
    } else if (startBracket !== -1) {
        firstCharIdx = startBracket;
        isObject = false;
    }

    if (firstCharIdx === -1) {
        // Just try parsing raw string in case it's perfectly clean and we somehow missed it
        const fallback = tryParse(cleaned);
        if (fallback) return fallback;
        throw new Error("INVALID_JSON: No valid JSON object or array could be located.");
    }

    // Isolate the text starting from the first `{` or `[`
    cleaned = cleaned.substring(firstCharIdx);

    // We can confidently assume the LAST closing brace/bracket goes to the same object
    const lastCharIdx = isObject ? cleaned.lastIndexOf('}') : cleaned.lastIndexOf(']');

    if (lastCharIdx > 0) {
        let isolated = cleaned.substring(0, lastCharIdx + 1);

        let parsed = tryParse(isolated);
        if (parsed) return parsed;

        // If it still fails, it may have a wrapper issue like { { "a": 1 } }
        // We will try extracting a smaller inner object as a fallback
        let innerStart = isObject ? isolated.indexOf('{', 1) : isolated.indexOf('[', 1);
        let innerEnd = isObject ? isolated.lastIndexOf('}', lastCharIdx - 1) : isolated.lastIndexOf(']', lastCharIdx - 1);

        if (innerStart !== -1 && innerEnd > innerStart) {
            let innerIsolated = isolated.substring(innerStart, innerEnd + 1);
            parsed = tryParse(innerIsolated);
            if (parsed) return parsed;
        }
    }

    // Ultimate fallback if slicing failed
    let parsed = tryParse(cleaned);
    if (parsed) return parsed;

    throw new Error("INVALID_JSON: Extracted string could not be parsed.");
}

async function generate({ agentId, sysPrompt, userPrompt, schema, isScript = false }) {
    if (process.env.AI_MODE === 'development') {
        throw new Error("AI_MODE=development is enabled, but no local DB mock output was found for this agent. API is blocked to protect quota. Switch to AI_MODE=production to generate new outputs.");
    }

    try {
        const { injectMemoryContext } = require('../memory/memoryRetriever');
        let agentNameMatch = sysPrompt.match(/You are the YouTube (.*?) agent/i) || sysPrompt.match(/You are the (.*?) Agent/i) || sysPrompt.match(/You are the (.*)/i);
        let agentName = agentNameMatch ? agentNameMatch[1].trim() : String(agentId);
        sysPrompt = injectMemoryContext(agentName, sysPrompt);
    } catch (e) {
        logger.warn(`Failed to inject memory layer: ${e.message}`);
    }

    const isResearch = sysPrompt.includes("Research Agent");
    let maxTokens = isScript ? ytConfig.SCRIPT_MAX_TOKENS : ytConfig.DEFAULT_MAX_TOKENS;
    if (isResearch && !isScript) maxTokens = 6000;
    if (sysPrompt.includes("Title Strategist")) maxTokens = 1500;

    const temperature = ytConfig.TEMPERATURE;

    // Retry only once (0 and 1)
    for (let attempts = 0; attempts < 2; attempts++) {
        let currentProvider = 'Unknown';
        try {
            const result = await routeGeneration({
                agentId, sysPrompt, userPrompt, maxTokens, temperature, attempts,
                validateFn: (text) => {
                    let parsed = extractJsonRobustly(text);

                    // Handle nested AI wrapper artifacts
                    if (parsed.structure && !parsed.openingPromise) parsed = parsed.structure;
                    if (parsed.videoStructure && !parsed.openingPromise) parsed = parsed.videoStructure;
                    if (parsed.data && !parsed.openingPromise) parsed = parsed.data;

                    try {
                        return schema.parse(parsed);
                    } catch (zodErr) {
                        if (zodErr.errors) {
                            const errorSummary = zodErr.errors.map(err => `- ${err.path.join('.')}: ${err.message}`).join('\n');
                            throw new Error(`SCHEMA_VALIDATION_FAILED:\n${errorSummary}`);
                        }
                        throw zodErr;
                    }
                }
            });

            currentProvider = result.provider;

            if (result.finishReason === 'length') {
                if (attempts === 0) {
                    sysPrompt += `\n\nERROR: Your previous response was truncated. Return the same JSON structure but compress descriptions significantly.`;
                    throw new Error("TRUNCATED_CONTENT");
                }
                throw new Error("Generation failed: Output consistently truncated.");
            }

            // Logging success safely
            logger.info({ agentId, provider: result.provider, model: result.model, attempt: attempts + 1, status: 'Success' }, `[Agent ${agentId}] Provider: ${result.provider}, Model: ${result.model}, Status: Success`);
            return result.parsed;

        } catch (e) {
            const isRateLimit = e.message.includes('429') || e.message.includes('Quota');
            const isParseError = e.message.includes('INVALID_JSON') || e.message.includes('SCHEMA_VALIDATION_FAILED') || e.message === 'EMPTY_RESPONSE';
            const isTruncated = e.message === 'TRUNCATED_CONTENT';

            let statusStr = "PROVIDER_ERROR";
            if (e.message.includes('INVALID_JSON')) statusStr = "INVALID_JSON";
            if (e.message.includes('EMPTY_RESPONSE')) statusStr = "EMPTY_RESPONSE";
            if (e.message.includes('SCHEMA_VALIDATION_FAILED')) statusStr = "INVALID_JSON"; // mapped to invalid json for logging

            let actionStr = isParseError || isTruncated ? "Cleanup and retry" : "Fallback provider";
            let reportedProvider = e.latestProvider || currentProvider || 'Unknown';
            let reportedModel = e.latestModel || 'Unknown';

            logger.error({ agentId, attempt: attempts + 1, status: statusStr }, `[AI Router] Agent: ${agentId} Provider: ${reportedProvider} Model: ${reportedModel} Status: ${statusStr} Action: ${actionStr} - Error: ${e.message}`);

            if (isRateLimit) {
                logger.error(`Quota/Rate Limit (429) hit on Provider ${reportedProvider}. Fallback exhausted. Exiting immediately.`);
                throw new Error("Quota Exhausted (429 Rate Limit) across providers. Please wait before generating again.");
            }

            if (!isParseError && !isTruncated) {
                // If it's a network error from the router loop failure, throw it
                throw e;
            }

            if (attempts === 1) {
                throw new Error(`YouTube AI Agent generation failed structurally: ${e.message}`);
            }

            // Retry for formatting failures
            sysPrompt += `\n\nERROR: Your previous response failed validation: ${e.message}. You MUST return ONLY a strictly valid flat JSON object. No pre-text.`;
        }
    }
}

module.exports = { generate };
