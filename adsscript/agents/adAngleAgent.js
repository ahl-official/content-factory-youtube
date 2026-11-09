const { generate } = require('../../services/ai/aiGenerator');
const { adAngleSchema } = require('../adsScriptSchemas');
const { findHookType } = require('../hookLibrary');
const promptGen = require('../prompts/adAnglePrompt');

async function runAdAngleAgent(project, audience, previousOutput = null, feedback = null) {
    const sysPrompt = promptGen.sysPrompt;
    const userPrompt = promptGen.buildUserPrompt(project, audience, previousOutput, feedback);

    const output = await generate({ agentId: 'ads_angle', sysPrompt, userPrompt, schema: adAngleSchema });

    // Models sometimes return the hook type's display name ("Pain Hook") instead of its id.
    // Store the canonical id when it matches the library; keep the raw value otherwise.
    const angleOptions = (output.angleOptions || []).map(a => {
        const match = findHookType(a.hookType);
        return match ? { ...a, hookType: match.id } : a;
    });
    return { ...output, angleOptions };
}

module.exports = { runAdAngleAgent };
