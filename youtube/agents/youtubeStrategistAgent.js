const { generate } = require('../../services/ai/aiGenerator');
const { strategistSchema } = require('../youtubeSchemas');
const promptGen = require('../prompts/strategistPrompt');

async function runStrategistAgent(projectContext, researchOutput, selectedAngleData, sirFeedback = null, previousOutput = null, feedback = null, consultationStoryData = null) {
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

    if (engineEnforcements.length > 0) {
        sysPrompt += `\n\n=== EXTREMELY CRITICAL PROJECT RULES ===\nYou MUST strictly follow these foundational rules for this specific project. Failure to use the exact brand name or tone specified here is unacceptable:\n${engineEnforcements.join('\n\n')}\n========================================\n`;
    }

    const userPrompt = promptGen.buildUserPrompt(contextToSend, researchOutput, selectedAngleData, sirFeedback, previousOutput, feedback);

    return await generate({ agentId: 3, sysPrompt: sysPrompt, userPrompt: userPrompt, schema: strategistSchema });
}

module.exports = { runStrategistAgent };
