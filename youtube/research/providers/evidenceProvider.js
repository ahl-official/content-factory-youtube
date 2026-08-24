const axios = require('axios');

async function runEvidenceResearch(query) {
    const evidenceEnabled = process.env.RESEARCH_EVIDENCE_ENABLED;

    if (String(evidenceEnabled) !== 'true') {
        return {
            provider: 'Evidence',
            status: 'not_configured',
            queryUsed: query,
            records: [],
            warnings: ['RESEARCH_EVIDENCE_ENABLED is not true - skipping evidence provider.']
        };
    }

    try {
        // e.g. CrossRef API (which is free and doesn't explicitly require an API key but requires mailto for polite pool)
        const res = await axios.get(`https://api.crossref.org/works`, {
            params: {
                query: query,
                select: 'title,author,URL,published-print,abstract',
                rows: 3
            },
            headers: { 'User-Agent': 'ResearchBot/1.0 (mailto:admin@example.com)' }
        });

        const records = res.data.message.items.map(item => ({
            sourcePlatform: 'CrossRef',
            sourceType: 'Academic Paper',
            title: item.title ? item.title[0] : 'Unknown Title',
            url: item.URL,
            authorOrChannel: item.author ? item.author.map(a => a.family).join(', ') : 'Unknown Author',
            publishedAt: item['published-print']?.['date-parts']?.[0]?.[0] || 'Unknown Date',
            metrics: {},
            excerptOrInsight: item.abstract ? item.abstract.substring(0, 300) : '',
            relevance: 'Verified Evidence'
        }));

        return {
            provider: 'Evidence',
            status: 'success',
            queryUsed: query,
            records,
            warnings: []
        };
    } catch (err) {
        return {
            provider: 'Evidence',
            status: 'failed',
            queryUsed: query,
            records: [],
            warnings: [err.message]
        };
    }
}

module.exports = { runEvidenceResearch };
