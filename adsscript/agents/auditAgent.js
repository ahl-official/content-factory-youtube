const { generate } = require('../../services/ai/aiGenerator');
const { adAuditSchema } = require('../adsScriptSchemas');
const promptGen = require('../prompts/auditPrompt');

async function runAuditAgent(project, audience, angle, draftScript, feedback = null) {
    const sysPrompt = promptGen.sysPrompt;
    const userPrompt = promptGen.buildUserPrompt(project, audience, angle, draftScript, feedback);

    return await generate({ agentId: 'ads_audit', sysPrompt, userPrompt, schema: adAuditSchema, isScript: true });
}

module.exports = { runAuditAgent };
