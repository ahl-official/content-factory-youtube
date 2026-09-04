const { generate } = require('../../services/ai/aiGenerator');
const { creativeDirectorSchema } = require('../youtubeSchemas');
const promptGen = require('../prompts/creativeDirectorPrompt');

async function runCreativeDirectorAgent(projectContext, researchOut, angleOut, structureOut, scriptOut, feedback = null, previousOutput = null) {
    let sysPrompt = promptGen.sysPrompt;

    let engineEnforcements = [];
    if (projectContext.BrandVoiceRule) engineEnforcements.push(`[MANDATORY BRAND TONE]: ${projectContext.BrandVoiceRule}`);
    if (projectContext.EditingStyleRule) engineEnforcements.push(`[MANDATORY EDITING STYLE]: ${projectContext.EditingStyleRule}`);
    if (projectContext._globalHookLibrary) engineEnforcements.push(`[MANDATORY HOOK LIBRARY]:\n${JSON.stringify(projectContext._globalHookLibrary, null, 2)}`);

    if (engineEnforcements.length > 0) {
        sysPrompt += `\n\n=== EXTREMELY CRITICAL PROJECT RULES ===\nYou MUST strictly follow these foundational rules for this specific project:\n${engineEnforcements.join('\n\n')}\n========================================\n`;
    }

    let userPrompt = promptGen.buildUserPrompt(projectContext, researchOut, angleOut, structureOut, scriptOut, feedback, previousOutput);

    let lastError = null;

    for (let attempts = 0; attempts < 3; attempts++) {
        try {
            // We pass `true` as the fourth argument (isScript) to grant Creative Director the higher 4000 max_tokens limit, since generating detailed scene breakdowns takes high output capacity.
            const result = await generate({ agentId: 6, sysPrompt: sysPrompt, userPrompt: userPrompt, schema: creativeDirectorSchema, isScript: true });

            if (!result || !result.chapters || !result.productionNotes) {
                throw new Error("Validation Failed: Missing chapters or productionNotes.");
            }

            if (!Array.isArray(result.chapters) || result.chapters.length === 0) {
                throw new Error("Validation Failed: chapters must be a non-empty array.");
            }

            return result;
        } catch (err) {
            lastError = err;
            console.warn(`Creative Director attempt ${attempts + 1} failed: ${err.message}. Retrying...`);
            userPrompt += `\n\nERROR IN PREVIOUS ATTEMPT: Your output failed validation: ${err.message}. Please strictly follow the JSON schema and ensure 'chapters' array and 'productionNotes' object are included natively in the root JSON object. Do not wrap in markdown or extraneous text.`;
        }
    }

    throw lastError;
}

module.exports = { runCreativeDirectorAgent };
