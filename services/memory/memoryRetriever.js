const fs = require('fs');
const path = require('path');
const logger = require('../../logger');

const MEMORY_PATH = path.join(__dirname, '../../memory/youtubeLearning.json');

function getMemoryContext(agentName) {
    if (!agentName) return null;

    try {
        if (!fs.existsSync(MEMORY_PATH)) return null;
        const memory = JSON.parse(fs.readFileSync(MEMORY_PATH, 'utf8'));
        const lowerAgent = agentName.toLowerCase();

        // 1. Sir Style Guide
        const styleRules = memory.learnedStyle || {};

        // 2. Extracted Rules
        const matchedRules = (memory.learnedPreferences || []).filter(pref =>
            !pref.appliesTo || pref.appliesTo.length === 0 || pref.appliesTo.some(a => lowerAgent.includes(a.toLowerCase()))
        );

        // 3. Approved Patterns
        const approvedPatterns = (memory.approvalHistory || []).filter(h =>
            h.agent && lowerAgent.includes(h.agent.toLowerCase())
        );

        // 4. Rejected Patterns
        const rejectedPatterns = (memory.rejectedIdeas || []).filter(rej =>
            rej.agent && lowerAgent.includes(rej.agent.toLowerCase())
        );

        return {
            styleRules,
            rules: matchedRules,
            approvedPatterns,
            rejectedPatterns
        };
    } catch (err) {
        logger.error(`Error retrieving memory context: ${err.message}`);
        return null;
    }
}

function injectMemoryContext(agentName, sysPrompt) {
    const ctx = getMemoryContext(agentName);
    if (!ctx) return sysPrompt;

    let injections = '';

    if (Object.keys(ctx.styleRules).length > 0) {
        injections += `\n\n=== SIR STYLE GUIDE ===\n`;
        Object.entries(ctx.styleRules).forEach(([k, v]) => injections += `- ${k}: ${v}\n`);
    }

    if (ctx.rules.length > 0) {
        const rulesText = ctx.rules.map(r => `- ${r.rule} (Category: ${r.category})`).join('\n');
        injections += `\n\n=== SIR'S LEARNED PREFERENCES (STRICT) ===\nYou must rigorously apply the following rules extracted from Sir's past feedback:\n${rulesText}\n`;
    }

    if (ctx.approvedPatterns.length > 0) {
        const appText = ctx.approvedPatterns.map(r => `- Approved example (Context: ${r.approvalReason}):\n"${r.output}"\n`).join('\n');
        injections += `\n\n=== APPROVED PATTERNS ===\nUse these examples as structural reference points:\n${appText}\n`;
    }

    if (ctx.rejectedPatterns.length > 0) {
        const rejText = ctx.rejectedPatterns.map(r => `- DO NOT DO: "${r.rejectedOutput}"\n  Reason: ${r.rejectionReason}\n  Rule: ${r.learnedAvoidRule}`).join('\n');
        injections += `\n\n=== REJECTED PATTERNS (DO NOT DO) ===\n${rejText}\n`;
    }

    if (injections.length > 0) {
        injections += `===========================================\n`;
    }

    return sysPrompt + injections;
}

module.exports = {
    getMemoryContext,
    injectMemoryContext
};
