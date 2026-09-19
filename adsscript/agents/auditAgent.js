const { generate } = require('../../services/ai/aiGenerator');
const { adAuditSchema } = require('../adsScriptSchemas');
const { validateScriptOutput } = require('../adsScriptValidation');
const promptGen = require('../prompts/auditPrompt');
const logger = require('../../logger');

// Same rationale as scriptWriterAgent.js: the audit sometimes correctly *identifies*
// a rule violation in its own notes but doesn't actually fix it in finalScript
// (observed live: it flagged a soft-opener hook, then kept the same hook). Validate
// finalScript itself, not just the notes, and force a real correction on failure.
async function runAuditAgent(project, audience, angle, draftScript, feedback = null) {
    const sysPrompt = promptGen.sysPrompt;
    let userPrompt = promptGen.buildUserPrompt(project, audience, angle, draftScript, feedback);

    let lastOutput = null;
    let lastViolations = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
        const output = await generate({ agentId: 'ads_audit', sysPrompt, userPrompt, schema: adAuditSchema, isScript: true });
        const violations = validateScriptOutput(output.finalScript);

        if (violations.length === 0) {
            return { ...output, finalScript: { ...output.finalScript, contentGuardPassed: true } };
        }

        lastOutput = output;
        lastViolations = violations;
        logger.warn({ attempt, violations }, `[Audit Agent] Attempt ${attempt} finalScript still violated content rules`);

        if (attempt < 2) {
            userPrompt += `\n\nYour rewritten finalScript still violates these rules — you identified some of them in auditNotes but did not actually fix them. Return a corrected finalScript (all fields, not a diff) that genuinely resolves:\n${violations.map(v => `- ${v}`).join('\n')}`;
        }
    }

    // Both attempts still violated the rules — return the best-effort result, but flagged,
    // so the caller/UI can warn the user instead of presenting it as a clean audit pass.
    return {
        ...lastOutput,
        finalScript: { ...lastOutput.finalScript, contentGuardPassed: false, contentGuardViolations: lastViolations }
    };
}

module.exports = { runAuditAgent };
