const { generate } = require('../../services/ai/aiGenerator');
const { editorSchema } = require('../youtubeSchemas');
const fs = require('fs');
const path = require('path');

const PROMPT_TEMPLATE = fs.readFileSync(path.join(__dirname, '../prompts/editorPrompt.js'), 'utf-8');

async function runEditorAgent(project, scriptOutput, productionPlan, thumbnailConcept, finalTitle, seoPackage, retentionReview, userFeedback = "", previousOutput = null) {

    // Fallbacks and parsing
    const script = typeof scriptOutput === 'string' ? scriptOutput : JSON.stringify(scriptOutput, null, 2);
    const prodPlan = typeof productionPlan === 'string' ? productionPlan : JSON.stringify(productionPlan, null, 2);
    const thumbStr = typeof thumbnailConcept === 'string' ? thumbnailConcept : JSON.stringify(thumbnailConcept, null, 2);
    const titleStr = finalTitle || "N/A";
    const seoStr = typeof seoPackage === 'string' ? seoPackage : JSON.stringify(seoPackage, null, 2);
    const retReview = typeof retentionReview === 'string' ? retentionReview : JSON.stringify(retentionReview || "None", null, 2);

    let prompt = PROMPT_TEMPLATE
        .replace('{{topic}}', project.WorkingTitle || project.SourceType || 'N/A')
        .replace('{{audience}}', project.TargetAudience || 'N/A')
        .replace('{{objective}}', project.BusinessObjective || 'N/A')
        .replace('{{brand}}', project.BrandGuidelines || 'Premium, clinical authority, no hype')
        .replace('{{script}}', script)
        .replace('{{productionPlan}}', prodPlan || 'None provided')
        .replace('{{thumbnail}}', thumbStr || 'None provided')
        .replace('{{title}}', titleStr)
        .replace('{{seo}}', seoStr || 'None provided')
        .replace('{{retentionReview}}', retReview)
        .replace('{{userFeedback}}', userFeedback || 'Build the foundational editor plan.');

    if (previousOutput) {
        prompt += `\n\n=== PREVIOUS OUTPUT TO REVISE ===\n${JSON.stringify(previousOutput, null, 2)}`;
    }

    if (project.EditingStyleRule) {
        prompt += `\n\n[MANDATORY EDITOR RULE]:\n${project.EditingStyleRule}`;
    }
    if (project._globalSirStyleGuide) {
        prompt += `\n\n[SIR'S GLOBAL STYLE GUIDE]:\n${project._globalSirStyleGuide}`;
    }


    let lastError = null;

    for (let attempts = 1; attempts <= 3; attempts++) {
        try {
            console.log(`[Editor Agent] Attempt ${attempts}...`);
            const passThroughSchema = { parse: (data) => data };

            let sysPrompt = PROMPT_TEMPLATE;
            let engineEnforcements = [];
            if (project.BrandVoiceRule) engineEnforcements.push(`[MANDATORY BRAND TONE]: ${project.BrandVoiceRule}`);
            if (project.EditingStyleRule) engineEnforcements.push(`[MANDATORY EDITING STYLE]: ${project.EditingStyleRule}`);
            if (project.CreatorPlaybookRule) engineEnforcements.push(`[CREATOR MODELING (EDITING)]: ${project.CreatorPlaybookRule}`);

            if (engineEnforcements.length > 0) {
                sysPrompt += `\n\n=== EXTREMELY CRITICAL PROJECT RULES ===\nYou MUST strictly follow these foundational rules for this specific project:\n${engineEnforcements.join('\n\n')}\n========================================\n`;
            }

            let rawData = await generate({ agentId: 11, sysPrompt: sysPrompt, userPrompt: prompt, schema: passThroughSchema, isScript: false });

            let validated;
            try {
                validated = editorSchema.parse(rawData);
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
            console.warn(`Editor attempt ${attempts} failed:`, e.message);
            if (attempts === 1) {
                prompt += `\n\nYour previous JSON was invalid. Missing or incorrect fields:\n${e.message}\n\nReturn the COMPLETE JSON object again. Do not omit any required key.`;
            } else if (attempts === 2) {
                prompt += `\n\nCRITICAL ERROR: Your output STILL failed schema validation. Missing keys: ${e.message}.`;
            }
        }
    }

    throw lastError;
}

module.exports = { runEditorAgent };
