const { generate } = require('../../services/ai/aiGenerator');
const { analyticsSchema } = require('../youtubeSchemas');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const ytDb = require('../youtubeDatabase');

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
        try {
            // First, get basic public statistics (Data API)
            const apiKey = process.env.YOUTUBE_API_KEY;
            let snippet = { title: "Unknown", publishedAt: "Unknown" };
            let pStats = { viewCount: 0, likeCount: 0, commentCount: 0 };

            if (apiKey) {
                const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoId}&key=${apiKey}`);
                if (response.data.items && response.data.items.length > 0) {
                    snippet = response.data.items[0].snippet;
                    pStats = response.data.items[0].statistics;
                }
            }

            // Now attempt Deep Analytics using 3-Legged OAuth
            let refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
            if (!refreshToken) {
                try {
                    const settings = await ytDb.getSettings();
                    refreshToken = settings.YOUTUBE_REFRESH_TOKEN;
                } catch (e) { }
            }

            if (refreshToken && process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET) {
                try {
                    const oauth2Client = new OAuth2Client(process.env.YOUTUBE_CLIENT_ID, process.env.YOUTUBE_CLIENT_SECRET);
                    oauth2Client.setCredentials({ refresh_token: refreshToken });

                    const endDate = new Date().toISOString().split('T')[0];
                    // YouTube Analytics API Call
                    const analyticsRes = await oauth2Client.request({
                        url: 'https://youtubeanalytics.googleapis.com/v2/reports',
                        params: {
                            ids: 'channel==MINE',
                            metrics: 'views,estimatedMinutesWatched,averageViewDuration',
                            dimensions: 'video',
                            filters: `video==${videoId}`,
                            startDate: '2020-01-01',
                            endDate: endDate
                        }
                    });

                    let oaViews = pStats.viewCount;
                    let watchTime = "N/A";
                    let avgDuration = "N/A";

                    if (analyticsRes.data && analyticsRes.data.rows && analyticsRes.data.rows.length > 0) {
                        const row = analyticsRes.data.rows[0];
                        // Usually matches metrics order: views (0), estimatedMinutesWatched (1), averageViewDuration (2)
                        oaViews = row[1] || pStats.viewCount; // Actually row[1] is index 1 of the request but dimensions are prepended. 
                        // Video dimension is at index 0, metrics at 1, 2, 3
                        watchTime = row[2] ? `${Math.round(row[2])} minutes` : "Unknown";
                        avgDuration = row[3] ? `${Math.round(row[3])} seconds` : "Unknown";
                    }

                    analyticsDataStr = `Deep Analytics Retrieved (OAuth Authenticated) for Video ID: ${videoId}\n` +
                        `Title: ${snippet.title}\n` +
                        `Published At: ${snippet.publishedAt}\n` +
                        `View Count: ${oaViews}\n` +
                        `Like Count: ${pStats.likeCount || 0}\n` +
                        `Comment Count: ${pStats.commentCount || 0}\n` +
                        `Total Watch Time: ${watchTime}\n` +
                        `Average View Duration: ${avgDuration}\n` +
                        `Note: Thumbnail CTR is not natively provided by the generic Analytics API, approximated manually.`;

                } catch (oauthErr) {
                    console.error("OAuth Analytics fetch failed. Falling back to public data:", oauthErr.message);
                    analyticsDataStr = constructPublicDataStr(videoId, snippet, pStats) + "\nWarning: OAuth Analytics Failed (Invalid Refresh Token or scopes).";
                }
            } else {
                analyticsDataStr = constructPublicDataStr(videoId, snippet, pStats) +
                    "\nNote: Deep Analytics (Watch Time, Average View Duration) requires frontend OAuth flow. Please authenticate to obtain the YOUTUBE_REFRESH_TOKEN.";
            }

        } catch (apiError) {
            console.error("YouTube Fetch Error:", apiError.message);
            analyticsDataStr = `Error retrieving data for Video ID: ${videoId}. Ensure your API keys and tokens are valid.`;
        }
    }

    function constructPublicDataStr(vId, snip, stats) {
        return `Analytics Data Retrieved (Public Mode) for Video ID: ${vId}\n` +
            `Title: ${snip.title}\n` +
            `Published At: ${snip.publishedAt}\n` +
            `View Count: ${stats.viewCount || 0}\n` +
            `Like Count: ${stats.likeCount || 0}\n` +
            `Comment Count: ${stats.commentCount || 0}`;
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

    prompt += '\n\nIMPORTANT: Return ONLY a raw, flat JSON object. Do not wrap it in ```json blocks or include any preamble text. Follow the exact schema required.';

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

            if (e.message.includes('429') || e.message.includes('Quota')) {
                console.error('Rate limit reached. Aborting retries.');
                throw e; // Do NOT retry on rate limits
            }

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
