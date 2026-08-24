const { generate } = require('../../services/ai/aiGenerator');
const { strategistSchema } = require('../youtubeSchemas');
const promptGen = require('../prompts/strategistPrompt');

async function runStrategistAgent(projectContext, researchOutput, selectedAngleData, sirFeedback = null, previousOutput = null, feedback = null, consultationStoryData = null) {
    let contextToSend = { ...projectContext };
    if (consultationStoryData) {
        contextToSend._consultationStory = consultationStoryData;
    }

    const sysPrompt = promptGen.sysPrompt;
    const userPrompt = promptGen.buildUserPrompt(contextToSend, researchOutput, selectedAngleData, sirFeedback, previousOutput, feedback);

    return await generate({ agentId: 3, sysPrompt: sysPrompt, userPrompt: userPrompt, schema: strategistSchema });
}

module.exports = { runStrategistAgent };
