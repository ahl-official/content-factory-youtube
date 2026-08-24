const { generate } = require('../../services/ai/aiGenerator');
const { structureSchema } = require('../youtubeSchemas');
const promptGen = require('../prompts/structurePrompt');

async function runStructureAgent(projectContext, researchOutput, selectedAngleData, strategistOutput, sirAngleFeedback = null, previousOutput = null, feedback = null, consultationStoryData = null) {
    let contextToSend = { ...projectContext };
    if (consultationStoryData) {
        contextToSend._consultationStory = consultationStoryData;
    }

    const sysPrompt = promptGen.sysPrompt;
    const userPrompt = promptGen.buildUserPrompt(contextToSend, researchOutput, selectedAngleData, strategistOutput, sirAngleFeedback, previousOutput, feedback);

    // Structure can be slightly larger, we don't necessarily need the script logic yet though
    return await generate({ agentId: 4, sysPrompt: sysPrompt, userPrompt: userPrompt, schema: structureSchema, isScript: true });
}

module.exports = { runStructureAgent };
