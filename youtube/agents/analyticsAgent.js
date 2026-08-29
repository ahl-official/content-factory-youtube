const { generate } = require('../../services/ai/aiGenerator');
const { analyticsSchema } = require('../youtubeSchemas');
const fs = require('fs');
const path = require('path');

const PROMPT_TEMPLATE = fs.readFileSync(path.join(__dirname, '../prompts/analyticsPrompt.js'), 'utf-8');

async function runAnalyticsAgent(project, analyticsUrl, scriptOutput, thumbnailConcept, finalTitle, feedback = "") {

    let videoId = null;
    let analyticsDataStr = "Pending Publication";

    if (analyticsUrl && (analyticsUrl.includes('youtube.com') || analyticsUrl.includes('youtu.be'))) {
        try {
            const urlObj = new URL(analyticsUrl);
            if (analyticsUrl.includes('youtu.be')) videoId = urlObj.pathname.slice(1);
            else videoId = urlObj.searchParams.get('v');
        } catch (e) {
            console.error("Failed to parse YouTube URL:", analyticsUrl);
        }
    }

    if (videoId) {
        // [PLACEHOLDER FOR YOUTUBE OAUTH2 INTERACTION]
        // Example:
        // const authClient = new OAuth2(process.env.YOUTUBE_CLIENT_ID, process.env.YOUTUBE_CLIENT_SECRET);
        // authClient.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });
        // const res = await youtubeAnalytics.reports.query({ ... ids: 'channel==MINE', dimensions: 'video', filters: `video==${videoId}` ...});
        // For now, until the key is live, we return a mock dataset indicating active pull
        analyticsDataStr = `Analytics Data Retrieved for Video ID: ${videoId}\nWatch Time: Waiting for OAuth Sync\nRetention Graph: Waiting for OAuth Sync\nCTR: Waiting for OAuth Sync`;
    }

    const script = typeof scriptOutput === 'string' ? scriptOutput : JSON.stringify(scriptOutput, null, 2);
    const thumbStr = typeof thumbnailConcept === 'string' ? thumbnailConcept : JSON.stringify(thumbnailConcept, null, 2);
    const titleStr = finalTitle || "N/A";

    let prompt = PROMPT_TEMPLATE
        .replace('{{analytics}}', analyticsDataStr)
        .replace('{{script}}', script)
        .replace('{{thumbnail}}', thumbStr || 'None provided')
        .replace('{{title}}', titleStr)
        .replace('{{userFeedback}}', feedback || '');

    let lastError = null;

    for (let attempts = 1; attempts <= 3; attempts++) {
        try {
            console.log(`[Analytics Agent] Attempt ${attempts}...`);
            const passThroughSchema = { parse: (data) => data };
            let rawData = await generate({ agentId: 15, sysPrompt: PROMPT_TEMPLATE, userPrompt: prompt, schema: passThroughSchema, isScript: false });

            let validated;
            try {
                validated = analyticsSchema.parse(rawData);
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
            console.warn(`Analytics attempt ${attempts} failed:`, e.message);
            if (attempts === 1) {
                prompt += `\n\nYour previous JSON was invalid. Missing or incorrect fields:\n${e.message}\n\nReturn the COMPLETE JSON object again. Do not omit any required key.`;
            } else if (attempts === 2) {
                prompt += `\n\nCRITICAL ERROR: Your output STILL failed schema validation. Missing keys: ${e.message}.`;
            }
        }
    }

    throw lastError;
}

module.exports = { runAnalyticsAgent };
