module.exports = async function (req, res) {
    const config = require('../../youtube/youtubeAgentsConfig');
    const ytDb = require('../../youtube/youtubeDatabase');

    try {
        const dbSettings = await ytDb.getSettings();

        res.status(200).json({
            aiConfig: {
                provider: config.YT_AI_PROVIDER,
                model: config.YT_AI_MODEL,
                fallbackStatus: config.YT_ALLOW_PAID_FALLBACK ? 'Enabled' : 'Disabled',
                connectionStatus: 'Connected (Live)',
                maxTokens: config.DEFAULT_MAX_TOKENS,
                scriptTokens: config.SCRIPT_MAX_TOKENS,
                temperature: config.TEMPERATURE
            },
            database: dbSettings,
            memory: {
                learnedStyle: {
                    contentStyle: 'Authoritative, clear, deeply educational.',
                    scriptStyle: 'High pacing, zero fluff, retention-driven.',
                    titlePreferences: 'Curiosity gaps, no clickbait.',
                    thumbnailPreferences: 'Minimal text, high contrast.',
                    brandPreferences: 'Premium quality always.'
                },
                learnedPreferences: [],
                approvalHistory: [],
                rejectedIdeas: []
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
