const { generate } = require('../../services/ai/aiGenerator');
const { adScriptSchema } = require('../adsScriptSchemas');
const promptGen = require('../prompts/scriptWriterPrompt');

async function runScriptWriterAgent(project, audience, angle, feedback = null) {
    const sysPrompt = promptGen.sysPrompt;
    const userPrompt = promptGen.buildUserPrompt(project, audience, angle, feedback);

    return await generate({ agentId: 'ads_script', sysPrompt, userPrompt, schema: adScriptSchema, isScript: true });
}

module.exports = { runScriptWriterAgent };
