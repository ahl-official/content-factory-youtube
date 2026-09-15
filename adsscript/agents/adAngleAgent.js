const { generate } = require('../../services/ai/aiGenerator');
const { adAngleSchema } = require('../adsScriptSchemas');
const promptGen = require('../prompts/adAnglePrompt');

async function runAdAngleAgent(project, audience, previousOutput = null, feedback = null) {
    const sysPrompt = promptGen.sysPrompt;
    const userPrompt = promptGen.buildUserPrompt(project, audience, previousOutput, feedback);

    return await generate({ agentId: 'ads_angle', sysPrompt, userPrompt, schema: adAngleSchema });
}

module.exports = { runAdAngleAgent };
