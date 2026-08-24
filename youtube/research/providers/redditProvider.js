async function runRedditResearch(query) {
    // Phase 3B currently disables direct unauthenticated direct Reddit /search.json 
    // due to 403 blocks. To enable in the future, implement OAuth here.
    return {
        provider: 'Reddit (Direct API)',
        status: 'oauth_required',
        queryUsed: query,
        records: [],
        warnings: ['Direct Reddit API disabled (HTTP 403). Community signals will route through Web Search.']
    };
}

module.exports = { runRedditResearch };
