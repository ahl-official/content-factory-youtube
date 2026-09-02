const { generate } = require('../../services/ai/aiGenerator');
const { metadataSchema } = require('../youtubeSchemas');

async function runMetadataAgent(projectData, agentData) {
    const sysPrompt = `You are the YouTube Metadata Agent.
Your purpose is to convert SEO output and core video structure into a complete, publish-ready YouTube metadata package.

Rules:
- Generate a highly optimized YouTube description natively incorporating keywords with a clear value proposition and CTA.
- Format chapters with strict timestamps (e.g., "00:00 - Introduction"). Ensure chapter titles contain keywords naturally.
- Recommend publishing elements (Playlists, End Screens, Cards).
- Explicitly pass all Brand Safety checks: Avoid exaggerated claims, guaranteed outcomes, or misleading titles.

Output must be ONLY valid JSON matching exactly this structure:
{
  "uploadMetadata": { "title", "description", "chapters", "tags", "hashtags", "category", "playlistSuggestion", "audienceType", "language", "pinnedCommentSuggestion" },
  "searchOptimization": { "primaryKeyword", "secondaryKeywords", "relatedSearchTerms", "faqKeywords" },
  "publishingRecommendations": { "endScreenSuggestion", "cardPlacement", "relatedVideos", "playlistRecommendation" },
  "brandSafetyCheck": { "exaggeratedClaimsAvoided", "guaranteedOutcomesAvoided", "misleadingTitlesAvoided", "premiumEducationalToneMaintained", "analysis" }
}`;

    const userPrompt = `
Topic: ${projectData.WorkingTitle}
Target Audience: ${projectData.TargetAudience || 'General Audience'}
SEO Context: ${JSON.stringify(agentData.seo || {}, null, 2)}
Script Summary: ${agentData.script?.scriptTitle || 'N/A'}
Chapters Draft: ${JSON.stringify(agentData.script?.chapters?.map(c => c.chapterTitle) || [])}

Generate the full YouTube Metadata JSON package perfectly formatted for immediate uploading to YouTube Studio.
`;

    const passThroughSchema = { parse: (data) => data };

    for (let attempts = 1; attempts <= 3; attempts++) {
        try {
            console.log(`[Metadata Agent] Attempt ${attempts}...`);
            let rawData = await generate({ agentId: 10.5, sysPrompt: sysPrompt, userPrompt: userPrompt, schema: metadataSchema });

            if (!rawData || !rawData.uploadMetadata) {
                throw new Error("Validation Failed: Empty output or missing uploadMetadata.");
            }

            return rawData;
        } catch (err) {
            console.warn(`Metadata Agent attempt ${attempts} failed: ${err.message}`);
            if (attempts === 3) throw err;
        }
    }
}

module.exports = { runMetadataAgent };
