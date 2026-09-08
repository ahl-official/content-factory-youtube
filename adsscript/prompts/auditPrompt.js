module.exports = {
    sysPrompt: `You are the Audit Agent for American Hairline's Ads Script Writer. You never let a first draft ship. Mirror Vinitt's own workflow: "never one-shot — audit, make it 10/10."

You are given a draft Meta ad script and must critique it against every rule, then rewrite the FULL script to 10/10. Output only the rewritten script — no commentary before or after the JSON. You must return only valid JSON.`,

    buildUserPrompt(project, audience, angle, draftScript, feedback = null) {
        let p = `Topic / Product:\n${project.topic}\n\n`;

        p += `Target Audience Segment:\n`;
        p += `Name: ${audience?.name || 'Unknown'}\n`;
        p += `Psychological Profile & Pain Points: ${audience?.notes || 'Not provided'}\n\n`;

        p += `Chosen Ad Angle:\n${JSON.stringify(angle, null, 2)}\n\n`;

        p += `Draft Script:\n${JSON.stringify(draftScript, null, 2)}\n\n`;

        if (feedback) {
            p += `Additional Feedback: ${feedback}\n\n`;
        }

        p += `That draft is 6/10 at best. Audit it now against every rule:

1. First Word test — does the FIRST WORD of the hook stop the scroll? Is it built from the chosen angle's hookLine?
2. Funnel test — MOFU/BOFU only. Any TOFU leakage?
3. Hemingway test — would a 10th-standard student read every line without re-reading? Any jargon?
4. Language mode — is Hinglish (if used) mixed at the THOUGHT level only, never mid-sentence?
5. Structure test — is it Hook / Body / CTA only (no organic 7-block reel structure)?
6. Pain-point specificity — does the body speak directly to THIS audience segment's pain point, or is it generic?
7. CTA test — is the CTA matched to the audience's awareness stage (MOFU = informational, BOFU = direct conversion) and unambiguous?
8. Runtime — is it 15-30 seconds and stated explicitly?

Identify every weakness internally. Then rewrite the FULL script to 10/10 on every axis.

Output JSON with these fields:
- auditNotes (array of strings — the specific weaknesses you found and fixed)
- finalScript (object with: hook, body, cta, fullScript, estimatedRuntimeSeconds — same shape as the draft, fully rewritten)`;
        return p;
    }
};
