const { generate } = require('../../services/ai/aiGenerator');
const { structureSchema } = require('../youtubeSchemas');
const promptGen = require('../prompts/structurePrompt');

async function runStructureAgent(projectContext, researchOutput, selectedAngleData, strategistOutput, sirAngleFeedback = null, previousOutput = null, feedback = null, consultationStoryData = null) {
    let contextToSend = { ...projectContext };
    if (consultationStoryData) {
        contextToSend._consultationStory = consultationStoryData;
    }

    let sysPrompt = promptGen.sysPrompt;

    let engineEnforcements = [];
    if (contextToSend.BrandVoiceRule) engineEnforcements.push(`[MANDATORY BRAND VOICE]: ${contextToSend.BrandVoiceRule}`);
    if (contextToSend.TargetAudienceRule) engineEnforcements.push(`[MANDATORY AUDIENCE RULE]: ${contextToSend.TargetAudienceRule}`);
    if (contextToSend.EditingStyleRule) engineEnforcements.push(`[MANDATORY EDITING STYLE]: ${contextToSend.EditingStyleRule}`);
    if (contextToSend.ThumbnailStyleRule) engineEnforcements.push(`[MANDATORY THUMBNAIL/VISUAL STYLE]: ${contextToSend.ThumbnailStyleRule}`);
    if (contextToSend._globalHookLibrary) engineEnforcements.push(`[MANDATORY HOOK LIBRARY]:\n${JSON.stringify(contextToSend._globalHookLibrary, null, 2)}`);

    if (engineEnforcements.length > 0) {
        sysPrompt += `\n\n=== EXTREMELY CRITICAL PROJECT RULES ===\nYou MUST strictly follow these foundational rules for this specific project. Failure to use the exact brand name or tone specified here is unacceptable:\n${engineEnforcements.join('\n\n')}\n========================================\n`;
    }

    const userPrompt = promptGen.buildUserPrompt(contextToSend, researchOutput, selectedAngleData, strategistOutput, sirAngleFeedback, previousOutput, feedback);

    // Structure can be slightly larger, we don't necessarily need the script logic yet though
    return await generate({ agentId: 4, sysPrompt: sysPrompt, userPrompt: userPrompt, schema: structureSchema, isScript: true });
}

module.exports = { runStructureAgent };
