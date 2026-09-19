const { generate } = require('../../services/ai/aiGenerator');
const { adScriptSchema } = require('../adsScriptSchemas');
const { validateScriptOutput } = require('../adsScriptValidation');
const promptGen = require('../prompts/scriptWriterPrompt');
const logger = require('../../logger');

// Content-rule violations (soft-opener hooks, HOOK:/BODY:/CTA: label leakage, missing
// runtime) slip through zod validation since they're valid JSON with the right shape —
// the fallback provider just doesn't follow the prose rules as reliably as the primary
// one. One corrective retry with the specific violations appended catches most of these.
async function runScriptWriterAgent(project, audience, angle, feedback = null) {
    const sysPrompt = promptGen.sysPrompt;
    let userPrompt = promptGen.buildUserPrompt(project, audience, angle, feedback);

    let lastOutput = null;
    let lastViolations = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
        const output = await generate({ agentId: 'ads_script', sysPrompt, userPrompt, schema: adScriptSchema, isScript: true });
        const violations = validateScriptOutput(output);

        if (violations.length === 0) return { ...output, contentGuardPassed: true };

        lastOutput = output;
        lastViolations = violations;
        logger.warn({ attempt, violations }, `[Script Writer Agent] Attempt ${attempt} violated content rules`);

        if (attempt < 2) {
            userPrompt += `\n\nYour previous draft violated these rules — fix them and return a corrected FULL script (all fields, not a diff):\n${violations.map(v => `- ${v}`).join('\n')}`;
        }
    }

    // Both attempts still violated the rules — return the best-effort result, but flagged,
    // so the caller/UI can warn the user instead of presenting it as a clean pass.
    return { ...lastOutput, contentGuardPassed: false, contentGuardViolations: lastViolations };
}

module.exports = { runScriptWriterAgent };
