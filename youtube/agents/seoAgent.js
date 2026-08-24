const { generate } = require('../../services/ai/aiGenerator');
const { seoPackageSchema } = require('../youtubeSchemas');
const promptGen = require('../prompts/seoPrompt');

async function runSeoAgent(projectContext, researchOut, finalTitle, scriptOut, thumbnailDirection, feedback = null, previousOutput = null) {
    const sysPrompt = promptGen.sysPrompt;
    let userPrompt = promptGen.buildUserPrompt(projectContext, researchOut, finalTitle, scriptOut, thumbnailDirection, feedback);

    const passThroughSchema = {
        parse: (data) => data
    };

    let lastError = null;

    for (let attempts = 1; attempts <= 3; attempts++) {
        try {
            console.log(`[SEO Agent] Attempt ${attempts}...`);
            let rawData = await generate({ agentId: 10, sysPrompt: sysPrompt, userPrompt: userPrompt, schema: passThroughSchema, isScript: false });

            if (!rawData || !rawData.seoPackage) {
                throw new Error("Validation Failed: Empty output or missing seoPackage.");
            }

            let validated;
            try {
                validated = seoPackageSchema.parse(rawData);
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
            console.warn(`SEO Agent attempt ${attempts} failed: ${err.message}`);

            if (attempts === 1) {
                userPrompt += `\n\nYour previous JSON was invalid. Missing or incorrect fields:\n${err.message}\n\nReturn the COMPLETE JSON object again. Do not omit any required key.`;
            } else if (attempts === 2) {
                userPrompt += `\n\nCRITICAL ERROR: Your output STILL failed schema validation. Missing keys: ${err.message}.`;
            }
        }
    }

    throw lastError;
}

module.exports = { runSeoAgent };
