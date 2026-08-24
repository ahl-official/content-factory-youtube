const { generate } = require('../../services/ai/aiGenerator');
const { qcSchema } = require('../youtubeSchemas');
const fs = require('fs');
const path = require('path');

const PROMPT_TEMPLATE = fs.readFileSync(path.join(__dirname, '../prompts/qcPrompt.js'), 'utf-8');

async function runQcAgent(project, scriptOutput, productionPlan, thumbnailConcept, finalTitle, seoPackage, editorPlan, retentionReview, brandReview, feedback = "") {

    const script = typeof scriptOutput === 'string' ? scriptOutput : JSON.stringify(scriptOutput, null, 2);
    const prodPlan = typeof productionPlan === 'string' ? productionPlan : JSON.stringify(productionPlan, null, 2);
    const thumbStr = typeof thumbnailConcept === 'string' ? thumbnailConcept : JSON.stringify(thumbnailConcept, null, 2);
    const titleStr = finalTitle || "N/A";
    const seoStr = typeof seoPackage === 'string' ? seoPackage : JSON.stringify(seoPackage, null, 2);
    const editStr = typeof editorPlan === 'string' ? editorPlan : JSON.stringify(editorPlan || "None", null, 2);
    const retStr = typeof retentionReview === 'string' ? retentionReview : JSON.stringify(retentionReview || "None", null, 2);
    const brandStr = typeof brandReview === 'string' ? brandReview : JSON.stringify(brandReview || "None", null, 2);

    let prompt = PROMPT_TEMPLATE
        .replace('{{script}}', script)
        .replace('{{productionPlan}}', prodPlan || 'None provided')
        .replace('{{thumbnail}}', thumbStr || 'None provided')
        .replace('{{title}}', titleStr)
        .replace('{{seo}}', seoStr || 'None provided')
        .replace('{{editorPlan}}', editStr)
        .replace('{{retentionReview}}', retStr)
        .replace('{{brandReview}}', brandStr)
        .replace('{{userFeedback}}', feedback || '');

    let lastError = null;

    for (let attempts = 1; attempts <= 3; attempts++) {
        try {
            console.log(`[QC Agent] Attempt ${attempts}...`);
            const passThroughSchema = { parse: (data) => data };
            let rawData = await generate({ agentId: 14, sysPrompt: PROMPT_TEMPLATE, userPrompt: prompt, schema: passThroughSchema, isScript: false });

            let validated;
            try {
                validated = qcSchema.parse(rawData);
            } catch (zodErr) {
                if (zodErr.errors) {
                    const errorSummary = zodErr.errors.map(err => `- ${err.path.join('.')}: ${err.message}`).join('\n');
                    throw new Error(`Zod Validation Failed:\n${errorSummary}`);
                }
                throw zodErr;
            }

            return validated;
        } catch (e) {
            lastError = e;
            console.warn(`QC attempt ${attempts} failed:`, e.message);
            if (attempts === 1) {
                prompt += `\n\nYour previous JSON was invalid. Missing or incorrect fields:\n${e.message}\n\nReturn the COMPLETE JSON object again. Do not omit any required key.`;
            } else if (attempts === 2) {
                prompt += `\n\nCRITICAL ERROR: Your output STILL failed schema validation. Missing keys: ${e.message}.`;
            }
        }
    }

    throw lastError;
}

module.exports = { runQcAgent };
