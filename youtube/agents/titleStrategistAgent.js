const { generate } = require('../../services/ai/aiGenerator');
const { titleStrategistSchema } = require('../youtubeSchemas');
const promptGen = require('../prompts/titleStrategistPrompt');

async function runTitleStrategistAgent(projectContext, researchOut, strategistOut, thumbnailConcept, feedback = null, previousOutput = null) {
    let sysPrompt = promptGen.sysPrompt;

    let engineEnforcements = [];
    if (projectContext.BrandVoiceRule) engineEnforcements.push(`[MANDATORY BRAND TONE]: ${projectContext.BrandVoiceRule}`);
    if (projectContext.TargetAudienceRule) engineEnforcements.push(`[MANDATORY AUDIENCE RULE]: ${projectContext.TargetAudienceRule}`);
    if (projectContext.CreatorPlaybookRule) engineEnforcements.push(`[CREATOR MODELING (TITLES)]: ${projectContext.CreatorPlaybookRule}`);

    if (engineEnforcements.length > 0) {
        sysPrompt += `\n\n=== EXTREMELY CRITICAL PROJECT RULES ===\nYou MUST strictly follow these foundational rules for this specific project:\n${engineEnforcements.join('\n\n')}\n========================================\n`;
    }
    let userPrompt = promptGen.buildUserPrompt(projectContext, researchOut, strategistOut, thumbnailConcept, feedback);

    const passThroughSchema = {
        parse: (data) => data
    };

    let lastError = null;

    for (let attempts = 1; attempts <= 3; attempts++) {
        try {
            console.log(`[Title Strategist] Attempt ${attempts}...`);
            let rawData = await generate({ agentId: 9, sysPrompt: sysPrompt, userPrompt: userPrompt, schema: passThroughSchema, isScript: false });

            if (!rawData || !rawData.titles) {
                throw new Error("Validation Failed: Empty output or missing titles array.");
            }

            if (rawData.titles && Array.isArray(rawData.titles)) {
                rawData.titles = rawData.titles.map((t, idx) => {
                    if (t && t.id !== undefined) {
                        let strId = String(t.id).trim();
                        if (/^[0-9]+$/.test(strId)) {
                            t.id = `T${strId}`;
                        } else {
                            t.id = strId;
                        }
                    } else if (t) {
                        t.id = `T${idx + 1}`;
                    }
                    return t;
                });
            }

            if (rawData.recommendedTitleId !== undefined) {
                let recId = String(rawData.recommendedTitleId).trim();
                if (/^[0-9]+$/.test(recId)) {
                    rawData.recommendedTitleId = `T${recId}`;
                } else {
                    rawData.recommendedTitleId = recId;
                }
            }

            let validated;
            try {
                validated = titleStrategistSchema.parse(rawData);
            } catch (zodErr) {
                if (zodErr.errors) {
                    const errorSummary = zodErr.errors.map(err => `- ${err.path.join('.')}: ${err.message}`).join('\n');
                    throw new Error(`Zod Validation Failed:\n${errorSummary}`);
                }
                throw zodErr;
            }

            if (validated.titles.length < 10) {
                throw new Error(`Expected exactly 15 titles, got ${validated.titles.length}.`);
            }

            return validated;

        } catch (err) {
            lastError = err;
            console.warn(`Title Strategist attempt ${attempts} failed: ${err.message}`);

            if (attempts === 1) {
                userPrompt += `\n\nYour previous JSON was invalid. Missing or incorrect fields:\n${err.message}\n\nReturn exactly 15 distinct title options in COMPLETE JSON format. id fields must be strings.`;
            } else if (attempts === 2) {
                userPrompt += `\n\nCRITICAL ERROR: Your output STILL failed schema validation. Missing keys: ${err.message}. Ensure string format for IDs like "T1".`;
            }
        }
    }

    throw lastError;
}

module.exports = { runTitleStrategistAgent };
