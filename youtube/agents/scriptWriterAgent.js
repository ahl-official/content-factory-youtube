const { generate } = require('../../services/ai/aiGenerator');
const { scriptSchema } = require('../youtubeSchemas');
const promptGen = require('../prompts/scriptPrompt');

async function runScriptAgent(projectContext, researchOut, angleOut, strategistOut, structureOut, sirAngleFb = null, sirStructureFb = null, previousOutput = null, feedback = null, consultationStoryData = null) {
    let contextToSend = { ...projectContext };
    if (consultationStoryData) {
        contextToSend._consultationStory = consultationStoryData;
    }

    let sysPrompt = promptGen.sysPrompt;

    // ENFORCE ENGINE TAB RULES STRONGLY AT THE SYS PROMPT LEVEL
    let engineEnforcements = [];
    if (contextToSend.BrandVoiceRule) engineEnforcements.push(`[MANDATORY BRAND VOICE]: ${contextToSend.BrandVoiceRule}`);
    if (contextToSend.TargetAudienceRule) engineEnforcements.push(`[MANDATORY AUDIENCE RULE]: ${contextToSend.TargetAudienceRule}`);
    if (contextToSend.EditingStyleRule) engineEnforcements.push(`[MANDATORY EDITING STYLE]: ${contextToSend.EditingStyleRule}`);
    if (contextToSend.ThumbnailStyleRule) engineEnforcements.push(`[MANDATORY THUMBNAIL/VISUAL STYLE]: ${contextToSend.ThumbnailStyleRule}`);
    if (contextToSend._globalHookLibrary) engineEnforcements.push(`[MANDATORY HOOK LIBRARY]:\n${JSON.stringify(contextToSend._globalHookLibrary, null, 2)}`);

    if (engineEnforcements.length > 0) {
        sysPrompt += `\n\n=== EXTREMELY CRITICAL PROJECT RULES ===\nYou MUST strictly follow these foundational rules for this specific project. Failure to use the exact brand name or tone specified here is unacceptable:\n${engineEnforcements.join('\n\n')}\n========================================\n`;
    }

    const userPrompt = promptGen.buildUserPrompt(contextToSend, researchOut, angleOut, strategistOut, structureOut, sirAngleFb, sirStructureFb, previousOutput, feedback);

    // isScript = true unlocks maxTokens required for long scripts
    let lastError = null;

    for (let attempts = 0; attempts < 1; attempts++) {
        try {
            const result = await generate({ agentId: 5, sysPrompt: sysPrompt, userPrompt: userPrompt, schema: scriptSchema, isScript: true });

            // PROGRAMMATICALLY ASSEMBLE FULL SCRIPT
            let compiledScript = result.opening ? result.opening + "\n\n" : "";

            const placeholders = ['[detailed script]', '[insert script]', '[continue]', '[placeholder]'];
            const hasPlaceholder = (text) => text && placeholders.some(p => text.includes(p));

            if (hasPlaceholder(result.opening)) throw new Error("Validation Failed: Opening contained placeholders.");

            if (result.chapters && Array.isArray(result.chapters)) {
                for (let i = 0; i < result.chapters.length; i++) {
                    const ch = result.chapters[i];

                    if (result.transitions && result.transitions[i - 1]) {
                        if (hasPlaceholder(result.transitions[i - 1])) throw new Error("Validation Failed: Transition contained placeholders.");
                        compiledScript += "TRANSITION: " + result.transitions[i - 1] + "\n\n";
                    }

                    if (!ch.scriptText || ch.scriptText.length < 50 || hasPlaceholder(ch.scriptText)) {
                        throw new Error(`Validation Failed: Chapter ${i + 1} scriptText was missing or contained placeholders.`);
                    }
                    compiledScript += `CHAPTER ${i + 1}: ${ch.chapterTitle}\n${ch.scriptText}\n\n`;

                    if (result.rehooks && result.rehooks[i]) {
                        if (hasPlaceholder(result.rehooks[i])) throw new Error("Validation Failed: Rehook contained placeholders.");
                        compiledScript += "REHOOK: " + result.rehooks[i] + "\n\n";
                    }
                }
            }

            if (result.cta) {
                if (hasPlaceholder(result.cta)) throw new Error("Validation Failed: CTA contained placeholders.");
                compiledScript += "CTA: " + result.cta + "\n\n";
            }

            if (result.ending) {
                if (hasPlaceholder(result.ending)) throw new Error("Validation Failed: Ending contained placeholders.");
                compiledScript += "ENDING: " + result.ending + "\n\n";
            }

            result.fullScript = compiledScript.trim();

            // VALIDATE SCRIPT COMPLETENESS ON FIRST PASS
            if (!result.fullScript || result.fullScript.length < 500) {
                throw new Error("Validation Failed: fullScript is missing or suspiciously short. Must contain actual narration.");
            }

            // CALCULATE ACTUAL WORD COUNT AND DURATION
            const wc = result.fullScript.split(/\s+/).length;
            result.estimatedWordCount = wc;
            result.estimatedDurationMinutes = Math.max(1, Math.round(wc / 150));

            // FINAL SANITY CHECK FOR RED-FLAG HALLUCINATIONS
            const upstreamJSONString = JSON.stringify({ contextToSend, researchOut, angleOut, strategistOut, structureOut, consultationStoryData }).toLowerCase();
            const lowerScript = result.fullScript.toLowerCase();

            const forbiddenIfMissing = [
                'norwood', '$', '₹', 'my partner', 'his friend', 'my barber', 'my friend', 'surgeon', 'clinic'
            ];

            for (const word of forbiddenIfMissing) {
                if (lowerScript.includes(word) && !upstreamJSONString.includes(word)) {
                    throw new Error(`Sanity Check Failed: Script hallucinated forbidden specific claim "${word}" not present upstream.`);
                }
            }

            return result;
        } catch (err) {
            lastError = err;
            console.warn(`Script validation attempt ${attempts + 1} failed: ${err.message}. Retrying...`);
        }
    }

    throw lastError;
}

module.exports = { runScriptAgent };
