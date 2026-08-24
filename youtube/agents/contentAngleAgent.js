const { generate } = require('../../services/ai/aiGenerator');
const { contentAngleSchema } = require('../youtubeSchemas');
const promptGen = require('../prompts/contentAnglePrompt');

async function runContentAngleAgent(projectContext, researchOutput, previousOutput = null, feedback = null, consultationStoryData = null) {
    let contextToSend = { ...projectContext };
    if (consultationStoryData) {
        contextToSend._consultationStory = consultationStoryData;
    }

    const sysPrompt = promptGen.sysPrompt;
    const userPrompt = promptGen.buildUserPrompt(contextToSend, researchOutput, previousOutput, feedback);

    return await generate({ agentId: 2, sysPrompt: sysPrompt, userPrompt: userPrompt, schema: contentAngleSchema });
}

module.exports = { runContentAngleAgent };
