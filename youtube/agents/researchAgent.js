const { generate } = require('../../services/ai/aiGenerator');
const { researchSchema, consultationStorySchema } = require('../youtubeSchemas');
const promptGen = require('../prompts/researchPrompt');
const consPromptGen = require('../prompts/consultationStoryPrompt');
const { executeProviders, resolveResearchQuery } = require('../research/researchOrchestrator');

async function runConsultationStory(projectContext) {
    const sysPrompt = consPromptGen.sysPrompt;
    const userPrompt = consPromptGen.buildUserPrompt(projectContext);
    return await generate({ agentId: 1, sysPrompt: sysPrompt, userPrompt: userPrompt, schema: consultationStorySchema });
}

async function runResearchAgent(projectContext, previousOutput = null, feedback = null, consultationStoryData = null) {
    // Collect external signals first
    const primaryQuery = resolveResearchQuery(projectContext, consultationStoryData);
    const providerResults = await executeProviders(primaryQuery);

    let providerStatuses = {};
    providerResults.forEach(pr => {
        providerStatuses[pr.provider] = pr.status;
    });

    let contextToSend = { ...projectContext };
    if (consultationStoryData) {
        contextToSend._consultationStory = consultationStoryData;
    }

    // Inject the raw external records into the context for the AI prompt
    contextToSend._externalResearch = providerResults;

    const sysPrompt = promptGen.sysPrompt;
    const userPrompt = promptGen.buildUserPrompt(contextToSend, previousOutput, feedback);

    const payload = await generate({ agentId: 1, sysPrompt: sysPrompt, userPrompt: userPrompt, schema: researchSchema });

    // Attach the statuses explicitly so the orchestrator returns them correctly
    payload.providerStatuses = providerStatuses;
    return payload;
}

module.exports = {
    runResearchAgent,
    runConsultationStory
};
