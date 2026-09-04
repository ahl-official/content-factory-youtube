const { generate } = require('../../services/ai/aiGenerator');
const { thumbnailDesignerSchema } = require('../youtubeSchemas');
const promptGen = require('../prompts/thumbnailDesignerPrompt');

async function runThumbnailDesignerAgent(projectContext, researchOut, scriptOut, approvedThumbnailConcept, feedback = null, previousOutput = null) {
    let sysPrompt = promptGen.sysPrompt;

    let engineEnforcements = [];
    if (projectContext.BrandVoiceRule) engineEnforcements.push(`[MANDATORY BRAND TONE]: ${projectContext.BrandVoiceRule}`);
    if (projectContext.ThumbnailStyleRule) engineEnforcements.push(`[MANDATORY THUMBNAIL/VISUAL STYLE]: ${projectContext.ThumbnailStyleRule}`);
    if (projectContext.TargetAudienceRule) engineEnforcements.push(`[MANDATORY AUDIENCE RULE]: ${projectContext.TargetAudienceRule}`);

    if (engineEnforcements.length > 0) {
        sysPrompt += `\n\n=== EXTREMELY CRITICAL PROJECT RULES ===\nYou MUST strictly follow these foundational rules for this specific project:\n${engineEnforcements.join('\n\n')}\n========================================\n`;
    }
    let userPrompt = promptGen.buildUserPrompt(projectContext, researchOut, scriptOut, approvedThumbnailConcept, feedback);

    const passThroughSchema = {
        parse: (data) => data
    };

    let lastError = null;

    for (let attempts = 1; attempts <= 3; attempts++) {
        try {
            console.log(`[Thumbnail Designer] Attempt ${attempts}...`);
            let rawData = await generate({ agentId: 8, sysPrompt: sysPrompt, userPrompt: userPrompt, schema: passThroughSchema, isScript: false });

            if (!rawData || !rawData.thumbnailDesign) {
                throw new Error("Validation Failed: Empty output or missing thumbnailDesign.");
            }

            if (rawData.thumbnailDesign && rawData.thumbnailDesign.conceptId !== undefined) {
                let recId = String(rawData.thumbnailDesign.conceptId).trim();
                if (/^[0-9]+$/.test(recId)) {
                    rawData.thumbnailDesign.conceptId = `TC${recId}`;
                } else {
                    rawData.thumbnailDesign.conceptId = recId;
                }
            }

            let validated;
            try {
                validated = thumbnailDesignerSchema.parse(rawData);
            } catch (zodErr) {
                if (zodErr.errors) {
                    const errorSummary = zodErr.errors.map(err => `- ${err.path.join('.')}: ${err.message}`).join('\n');
                    throw new Error(`Zod Validation Failed:\n${errorSummary}`);
                }
                throw zodErr;
            }

            return validated;

        } catch (err) {
            lastError = err;
            console.warn(`Thumbnail Designer attempt ${attempts} failed: ${err.message}`);

            if (attempts === 1) {
                userPrompt += `\n\nYour previous JSON was invalid. Missing or incorrect fields:\n${err.message}\n\nReturn the COMPLETE JSON object again. Do not return a patch. Do not omit any required key. id/conceptId must be a string like "TC1", never a number.`;
            } else if (attempts === 2) {
                userPrompt += `\n\nCRITICAL ERROR: Your output STILL failed schema validation. Missing keys: ${err.message}.`;
            }
        }
    }

    throw lastError;
}

module.exports = { runThumbnailDesignerAgent };
