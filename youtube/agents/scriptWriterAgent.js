const { generate } = require('../../services/ai/aiGenerator');
const { scriptSchema } = require('../youtubeSchemas');
const promptGen = require('../prompts/scriptPrompt');

async function runScriptAgent(projectContext, researchOut, angleOut, strategistOut, structureOut, sirAngleFb = null, sirStructureFb = null, previousOutput = null, feedback = null, consultationStoryData = null) {
    let contextToSend = { ...projectContext };
    if (consultationStoryData) {
        contextToSend._consultationStory = consultationStoryData;
    }

    const sysPrompt = promptGen.sysPrompt;
    const userPrompt = promptGen.buildUserPrompt(contextToSend, researchOut, angleOut, strategistOut, structureOut, sirAngleFb, sirStructureFb, previousOutput, feedback);

    // isScript = true unlocks maxTokens required for long scripts
    let lastError = null;

    for (let attempts = 0; attempts < 1; attempts++) {
        try {
            const result = await generate({ agentId: 5, sysPrompt: sysPrompt, userPrompt: userPrompt, schema: scriptSchema, isScript: true });

            // PROGRAMMATICALLY ASSEMBLE FULL SCRIPT
            let compiledScript = result.opening ? result.opening + "\n\n" : "";

            const placeholders = ['...', '[detailed script]', '[insert script]', '[continue]', 'CHAPTER 1'];
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

            // --- FINAL GROUNDING VALIDATION PASS ---
            const groundingSysPrompt = `You are a Factual Grounding Editor for YouTube scripts.
Your ONLY job is to read an assembled script and verify every specific claim against approved upstream data. 
A subject-specific claim is allowed ONLY if it is explicitly present in the Approved Upstream Data.

Flag and rewrite unsupported claims (in BOTH first-person and third-person) involving:
- age, Norwood classification, diagnosis, personal event, personal conversation
- surgeon consultation, specialist observation, scalp examination, fitting experience
- gym/wind/pool/sleep test, partner/barber/colleague reaction, adhesive failure
- exact maintenance behavior, exact timeline, percentage, cost, exact product lifespan
- medication requirement, measured outcome, comparison result
- phrases like "no one noticed" or "seamless under every light"

This applies strictly whether the sentence says "I...", "He...", "The subject...", or "The specialist...".

ACTIONS FOR UNSUPPORTED CLAIMS:
1. KEEP: Only if explicitly supported upstream.
2. GENERALIZE: If useful educational context can be stated safely without pretending it happened to the subject (e.g. "Some users also think about how to discuss the change").
3. REMOVE: If generalizing still creates an unsupported factual or medical claim.

Do NOT invent new statistics, medical claims, maintenance schedules, prices, or timelines. Truthfulness > detail.
Preserve the approved angle, chapter order, transitions, and pacing, but factual grounding has priority over dramatic specificity.
Return purely the corrected JSON.`;

            const groundingUserPrompt = `Approved Upstream Context:
Project: ${JSON.stringify(contextToSend)}
Research: ${JSON.stringify(researchOut)}
Angle: ${JSON.stringify(angleOut)}
Strategist: ${JSON.stringify(strategistOut)}
Structure: ${JSON.stringify(structureOut)}
Sir Angle Feedback: ${sirAngleFb ? sirAngleFb : "None"}
Sir Structure Feedback: ${sirStructureFb ? sirStructureFb : "None"}
Consultation Story: ${consultationStoryData ? JSON.stringify(consultationStoryData) : "None"}
Previous Output: ${previousOutput ? JSON.stringify(previousOutput) : "None"}
Sir Script Feedback: ${feedback ? feedback : "None"}

Generated Script To Edit:
${JSON.stringify(result)}

Execute the grounding pass. Return purely the corrected JSON.`;

            const finalGroundedResult = await generate({ agentId: 5, sysPrompt: groundingSysPrompt, userPrompt: groundingUserPrompt, schema: scriptSchema, isScript: true });

            // Re-compile final script after grounding pass
            let finalCompiledScript = finalGroundedResult.opening ? finalGroundedResult.opening + "\n\n" : "";

            if (finalGroundedResult.chapters && Array.isArray(finalGroundedResult.chapters)) {
                for (let i = 0; i < finalGroundedResult.chapters.length; i++) {
                    const ch = finalGroundedResult.chapters[i];
                    if (finalGroundedResult.transitions && finalGroundedResult.transitions[i - 1]) {
                        finalCompiledScript += "TRANSITION: " + finalGroundedResult.transitions[i - 1] + "\n\n";
                    }
                    finalCompiledScript += `CHAPTER ${i + 1}: ${ch.chapterTitle}\n${ch.scriptText}\n\n`;
                    if (finalGroundedResult.rehooks && finalGroundedResult.rehooks[i]) {
                        finalCompiledScript += "REHOOK: " + finalGroundedResult.rehooks[i] + "\n\n";
                    }
                }
            }
            if (finalGroundedResult.cta) finalCompiledScript += "CTA: " + finalGroundedResult.cta + "\n\n";
            if (finalGroundedResult.ending) finalCompiledScript += "ENDING: " + finalGroundedResult.ending + "\n\n";

            finalGroundedResult.fullScript = finalCompiledScript.trim();

            if (!finalGroundedResult.fullScript || finalGroundedResult.fullScript.length < 500) {
                throw new Error("Validation Failed: Final Grounding Pass maliciously truncated the script.");
            }

            // CALCULATE ACTUAL WORD COUNT AND DURATION
            const wc = finalGroundedResult.fullScript.split(/\s+/).length;
            finalGroundedResult.estimatedWordCount = wc;
            finalGroundedResult.estimatedDurationMinutes = Math.max(1, Math.round(wc / 150));

            // FINAL SANITY CHECK FOR RED-FLAG HALLUCINATIONS
            const upstreamJSONString = JSON.stringify({ contextToSend, researchOut, angleOut, strategistOut, structureOut, consultationStoryData }).toLowerCase();
            const lowerScript = finalGroundedResult.fullScript.toLowerCase();

            const forbiddenIfMissing = [
                'norwood', '$', '₹', 'my partner', 'his friend', 'my barber', 'my friend', 'surgeon', 'clinic'
            ];

            for (const word of forbiddenIfMissing) {
                if (lowerScript.includes(word) && !upstreamJSONString.includes(word)) {
                    throw new Error(`Sanity Check Failed: Script hallucinated forbidden specific claim "${word}" not present upstream.`);
                }
            }

            return finalGroundedResult;
        } catch (err) {
            lastError = err;
            console.warn(`Script validation attempt ${attempts + 1} failed: ${err.message}. Retrying...`);
        }
    }

    throw lastError;
}

module.exports = { runScriptAgent };
