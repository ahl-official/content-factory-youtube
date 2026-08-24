const axios = require('axios');

async function runYouTubeResearch(query) {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        return {
            provider: 'YouTube',
            status: 'not_configured',
            queryUsed: query,
            records: [],
            warnings: ['YOUTUBE_API_KEY missing - skipping YouTube research.']
        };
    }

    try {
        const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: query,
                type: 'video',
                maxResults: 10,
                key: apiKey
            }
        });

        const items = res.data.items || [];
        if (items.length === 0) {
            return { provider: 'YouTube', status: 'no_results', queryUsed: query, records: [], warnings: [] };
        }

        const videoIds = items.map(i => i.id.videoId).join(',');
        const statsRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                part: 'statistics',
                id: videoIds,
                key: apiKey
            }
        });

        const statsMap = {};
        if (statsRes.data.items) {
            statsRes.data.items.forEach(v => {
                statsMap[v.id] = {
                    views: v.statistics.viewCount,
                    comments: v.statistics.commentCount
                };
            });
        }

        const records = items.map(item => ({
            sourcePlatform: 'YouTube',
            sourceType: 'Video',
            title: item.snippet.title,
            url: `https://youtube.com/watch?v=${item.id.videoId}`,
            authorOrChannel: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            metrics: statsMap[item.id.videoId] || {},
            excerptOrInsight: item.snippet.description,
            relevance: 'High'
        }));

        return {
            provider: 'YouTube',
            status: 'success',
            queryUsed: query,
            records,
            warnings: []
        };
    } catch (err) {
        return {
            provider: 'YouTube',
            status: 'failed',
            queryUsed: query,
            records: [],
            warnings: [err.message]
        };
    }
}

module.exports = { runYouTubeResearch };
