const axios = require('axios');

async function runWebSearch(query) {
    const provider = process.env.RESEARCH_SEARCH_PROVIDER;
    const apiKey = process.env.RESEARCH_SEARCH_API_KEY;

    if (!provider || !apiKey) {
        return {
            provider: 'Search',
            status: 'not_configured',
            queryUsed: query,
            records: [],
            warnings: ['RESEARCH_SEARCH_PROVIDER or RESEARCH_SEARCH_API_KEY missing - skipping search.']
        };
    }

    try {
        let records = [];
        if (provider.toLowerCase() === 'serpapi') {
            const res = await axios.get('https://serpapi.com/search', {
                params: {
                    engine: 'google',
                    q: query,
                    api_key: apiKey
                }
            });

            if (res.data.organic_results) {
                records = res.data.organic_results.slice(0, 5).map(item => ({
                    sourcePlatform: 'Web Search',
                    sourceType: 'Web Page',
                    title: item.title,
                    url: item.link,
                    authorOrChannel: item.source || 'Unknown',
                    publishedAt: item.date || null,
                    metrics: {},
                    excerptOrInsight: item.snippet,
                    relevance: 'High'
                }));
            }
        } else {
            return {
                provider: 'Search',
                status: 'failed',
                queryUsed: query,
                records: [],
                warnings: [`Unsupported search provider: ${provider}`]
            };
        }

        return {
            provider: 'Search',
            status: 'success',
            queryUsed: query,
            records,
            warnings: []
        };
    } catch (err) {
        return {
            provider: 'Search',
            status: 'failed',
            queryUsed: query,
            records: [],
            warnings: [err.message]
        };
    }
}

module.exports = { runWebSearch };
