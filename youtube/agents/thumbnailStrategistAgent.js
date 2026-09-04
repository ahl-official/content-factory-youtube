const { generate } = require('../../services/ai/aiGenerator');
const { thumbnailStrategistSchema } = require('../youtubeSchemas');
const promptGen = require('../prompts/thumbnailStrategistPrompt');

async function runThumbnailStrategistAgent(projectContext, researchOut, angleOut, scriptOut, creativeDirectorOut, feedback = null, previousOutput = null) {
    let sysPrompt = promptGen.sysPrompt;

    let engineEnforcements = [];
    if (projectContext.BrandVoiceRule) engineEnforcements.push(`[MANDATORY BRAND TONE]: ${projectContext.BrandVoiceRule}`);
    if (projectContext.ThumbnailStyleRule) engineEnforcements.push(`[MANDATORY THUMBNAIL/VISUAL STYLE]: ${projectContext.ThumbnailStyleRule}`);
    if (projectContext.TargetAudienceRule) engineEnforcements.push(`[MANDATORY AUDIENCE RULE]: ${projectContext.TargetAudienceRule}`);
    if (projectContext.CreatorPlaybookRule) engineEnforcements.push(`[CREATOR MODELING (THUMBNAIL)]: ${projectContext.CreatorPlaybookRule}`);

    if (engineEnforcements.length > 0) {
        sysPrompt += `\n\n=== EXTREMELY CRITICAL PROJECT RULES ===\nYou MUST strictly follow these foundational rules for this specific project:\n${engineEnforcements.join('\n\n')}\n========================================\n`;
    }

    let userPrompt = promptGen.buildUserPrompt(projectContext, researchOut, angleOut, scriptOut, creativeDirectorOut, previousOutput, feedback);

    // Dummy schema to bypass runOpenRouter's internal strict Zod enforcement, 
    // allowing us to normalize and retry at this level.
    const passThroughSchema = {
        parse: (data) => data
    };

    let lastError = null;

    for (let attempts = 1; attempts <= 3; attempts++) {
        try {
            console.log(`[Thumbnail Strategist] Attempt ${attempts}...`);
            let rawData = await generate({ agentId: 7, sysPrompt: sysPrompt, userPrompt: userPrompt, schema: passThroughSchema, isScript: false });

            if (!rawData) {
                throw new Error("Validation Failed: Empty output from model.");
            }

            // Normalization Layer
            if (rawData.thumbnailConcepts && Array.isArray(rawData.thumbnailConcepts)) {
                rawData.thumbnailConcepts = rawData.thumbnailConcepts.map(c => {
                    if (c && c.id !== undefined) {
                        let strId = String(c.id).trim();
                        // Fix '1' -> 'TC1'
                        if (/^[0-9]+$/.test(strId)) {
                            c.id = `TC${strId}`;
                        } else {
                            c.id = strId;
                        }
                    }
                    return c;
                });
            }

            if (rawData.recommendedConceptId !== undefined) {
                let recId = String(rawData.recommendedConceptId).trim();
                if (/^[0-9]+$/.test(recId)) {
                    rawData.recommendedConceptId = `TC${recId}`;
                } else {
                    rawData.recommendedConceptId = recId;
                }
            }

            // Validation Layer
            let validated;
            try {
                validated = thumbnailStrategistSchema.parse(rawData);
            } catch (zodErr) {
                if (zodErr.errors) {
                    const errorSummary = zodErr.errors.map(err => `- ${err.path.join('.')}: ${err.message}`).join('\n');
                    throw new Error(`Zod Validation Failed:\n${errorSummary}`);
                }
                throw zodErr;
            }

            if (validated.thumbnailConcepts.length !== 5) {
                // If it generated 6 or 4 instead of 5, we can strictly complain.
                throw new Error(`Validation Failed: Must generate exactly 5 distinct thumbnail concepts. You generated ${validated.thumbnailConcepts.length}.`);
            }

            return validated;

        } catch (err) {
            lastError = err;
            console.warn(`Thumbnail Strategist attempt ${attempts} failed: ${err.message}`);

            // On Attempt 2, give exact Zod validation errors.
            if (attempts === 1) {
                userPrompt += `\n\nYour previous JSON was invalid.\nMissing or incorrect fields:\n${err.message}\n\nReturn the COMPLETE JSON object again.\nDo not return a patch.\nDo not omit any required key.`;
            }
            // On Attempt 3, provide stronger compact correction
            else if (attempts === 2) {
                userPrompt += `\n\nCRITICAL ERROR: Your output STILL failed schema validation. You MUST return exactly 5 concepts inside a single JSON object with EXACT keys matching the prompt. Missing keys: ${err.message}.`;
            }
        }
    }

    throw lastError;
}

module.exports = { runThumbnailStrategistAgent };
