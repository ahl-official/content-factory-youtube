const { runYouTubeResearch } = require('./providers/youtubeProvider');
const { runWebSearch } = require('./providers/webSearchProvider');
const { runRedditResearch } = require('./providers/redditProvider');
const { runEvidenceResearch } = require('./providers/evidenceProvider');

async function runCommunitySearch(query) {
    const communityQuery = `site:reddit.com ${query} (problems OR experience OR questions OR regret)`;
    const result = await runWebSearch(communityQuery);

    if (result.status === 'success') {
        result.records.forEach(r => {
            r.sourcePlatform = 'Reddit';
            r.sourceType = 'Community Discussion';
            r.acquisitionMethod = 'web_search';
            // keep r.url to the actual Reddit thread
        });
    }

    return {
        provider: 'Community Search',
        status: result.status,
        queryUsed: communityQuery,
        records: result.records,
        warnings: result.warnings
    };
}

async function executeProviders(query) {
    const promises = [
        runYouTubeResearch(query).catch(e => ({ provider: 'YouTube', status: 'failed', records: [], warnings: [e.message] })),
        runWebSearch(query).catch(e => ({ provider: 'Search', status: 'failed', records: [], warnings: [e.message] })),
        runRedditResearch(query).catch(e => ({ provider: 'Reddit (Direct API)', status: 'failed', records: [], warnings: [e.message] })),
        runEvidenceResearch(query).catch(e => ({ provider: 'Evidence', status: 'failed', records: [], warnings: [e.message] })),
        runCommunitySearch(query).catch(e => ({ provider: 'Community Search', status: 'failed', records: [], warnings: [e.message] }))
    ];

    const results = await Promise.allSettled(promises);

    return results.map((result, idx) => {
        if (result.status === 'fulfilled') {
            return result.value;
        } else {
            const names = ['YouTube', 'Search', 'Reddit (Direct API)', 'Evidence', 'Community Search'];
            return {
                provider: names[idx],
                status: 'failed',
                records: [],
                warnings: [result.reason?.message || 'Unknown error']
            };
        }
    });
}

function resolveResearchQuery(project, consultationStoryData = null) {
    const isDiscovery = project.ResearchBehavior === 'suggest_topics';
    const type = project.SourceType || 'Original Topic';

    // We assume CanonicalTopic has been copied to WorkingTitle when a topic is selected.
    const canonicalTopic = project.WorkingTitle;

    // 1. DEEP RESEARCH RULE: ALL source types use CanonicalTopic
    if (!isDiscovery && canonicalTopic) {
        return canonicalTopic;
    }

    // 2. DISCOVERY RULE: Derive from specific seed contents
    switch (type) {
        case 'Original Topic':
            // "ResearchSeed" isn't explicitly separate in DB from WorkingTitle typically during creation
            return project.WorkingTitle || 'Content Strategy';
        case 'Consultation':
            if (consultationStoryData) {
                const parsed = typeof consultationStoryData === 'string' ? JSON.parse(consultationStoryData) : consultationStoryData;
                return (parsed?.keyConcern || parsed?.clientGoal || 'Client Consultation').substring(0, 50).trim();
            }
            return (project.consultationContext || project.TargetAudience || '').substring(0, 50).trim() || 'Client Experience';
        case 'Transformation':
            return (project.transformationChanged || project.transformationFocus || project.TargetAudience || '').substring(0, 50).trim() || 'Before and After';
        case 'Reference':
            return (project.WorkingTitle || project.referenceLearnings || '').substring(0, 50).trim() || 'Industry Reference';
        default:
            return project.WorkingTitle || 'General Topic';
    }
}

module.exports = { executeProviders, resolveResearchQuery, runCommunitySearch };
