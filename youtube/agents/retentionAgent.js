const { generate } = require('../../services/ai/aiGenerator');
const { retentionSchema } = require('../youtubeSchemas');

const PROMPT_TEMPLATE = require('../prompts/retentionPrompt');

async function runRetentionAgent(project, scriptOutput, productionPlan, thumbnailConcept, finalTitle, seoPackage, editorPlan, feedback = "") {

    const script = typeof scriptOutput === 'string' ? scriptOutput : JSON.stringify(scriptOutput, null, 2);
    const prodPlan = typeof productionPlan === 'string' ? productionPlan : JSON.stringify(productionPlan, null, 2);
    const thumbStr = typeof thumbnailConcept === 'string' ? thumbnailConcept : JSON.stringify(thumbnailConcept, null, 2);
    const titleStr = finalTitle || "N/A";
    const seoStr = typeof seoPackage === 'string' ? seoPackage : JSON.stringify(seoPackage, null, 2);
    const editStr = typeof editorPlan === 'string' ? editorPlan : JSON.stringify(editorPlan || "None", null, 2);

    let prompt = PROMPT_TEMPLATE
        .replace('{{topic}}', project.WorkingTitle || project.SourceType || 'N/A')
        .replace('{{audience}}', project.TargetAudience || 'N/A')
        .replace('{{script}}', script)
        .replace('{{productionPlan}}', prodPlan || 'None provided')
        .replace('{{thumbnail}}', thumbStr || 'None provided')
        .replace('{{title}}', titleStr)
        .replace('{{seo}}', seoStr || 'None provided')
        .replace('{{editorPlan}}', editStr)
        .replace('{{userFeedback}}', feedback || '');

    try {
        console.log(`[Retention Agent] Generating analysis...`);
        let validated = await generate({
            agentId: 12,
            sysPrompt: PROMPT_TEMPLATE,
            userPrompt: prompt,
            schema: retentionSchema,
            isScript: false
        });

        return validated;
    } catch (e) {
        console.warn(`Retention generation failed:`, e.message);
        throw e;
    }
}

module.exports = { runRetentionAgent };
