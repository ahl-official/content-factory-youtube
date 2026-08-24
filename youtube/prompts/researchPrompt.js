module.exports = {
    sysPrompt: `You are the YouTube Research Agent.
Your job is to identify high-potential YouTube topics and evidence-backed content opportunities based entirely on the provided project context AND external research records.
You must synthesize ONLY from the provided signals and context. Do NOT invent missing metrics, sources, or search volume.
Every important synthesized insight should be traceable to sources/signals where possible.
You must return only valid JSON matching the exact schema provided.`,

    buildUserPrompt(projectContext, previousOutput, feedback) {
        // Create a copy without massive externalResearch stringification unless we format it well
        const contextToSend = { ...projectContext };
        const extResearch = contextToSend._externalResearch;
        delete contextToSend._externalResearch;

        let p = `Project Context:\n${JSON.stringify(contextToSend, null, 2)}\n\n`;

        if (extResearch) {
            p += `External Research Signals:\n${JSON.stringify(extResearch, null, 2)}\n\n`;
        }

        if (previousOutput) {
            p += `Previous Output:\n${JSON.stringify(previousOutput, null, 2)}\n\n`;
        }

        if (feedback) {
            p += `Sir's Feedback: ${feedback}\n\nPlease revise strictly adhering to Sir's feedback.\n\n`;
        }

        if (projectContext.ResearchBehavior === 'suggest_topics') {
            p += `Since the user wants to discover video topics, your primary goal is to suggest 10 to 20 distinct topic opportunities based on the source context and external signals.

Topic discovery should not behave like an SEO keyword generator.

Prioritize YouTube Browse potential.

Generate topics based on:
- hidden audience fears
- decision moments
- curiosity gaps
- misconceptions
- emotional conflicts
- transformation journeys
- comparison decisions

Avoid generic educational titles unless they have a strong curiosity hook.

For every topic evaluate:
1. Why would someone click this on YouTube?
2. What viewer pain does it solve?
3. What emotional question is behind this topic?
4. Does it create a strong video promise?

Prefer:
"Can people tell you're wearing a hair system?"
over:
"Types of hair system bases explained"

Prefer:
"Why some hair systems look fake"
over:
"Hair system maintenance guide"

Discovery should optimize for:
Browse potential > Search volume alone.

Output required JSON fields:
- topicOpportunities: Array of 10-20 objects with id, topicIdea, coreAudienceQuestion, whyItWorks, targetAudience, searchPotential, browsePotential, competitionLevel, contentGapStrength, businessFit, freshness, evidenceAvailability, confidence, and supportingSignals[] (Array of source names/IDs).
If you lack data for a metric, output "Unknown" or null. Do not hallucinate precision.
- confidenceNotes: Your overall confidence notes.

COMPRESSION AND FORMATTING RULES:
- Return ONLY valid JSON format.
- No markdown fences (e.g., \`\`\`json).
- No explanations outside the JSON.
- Avoid repeated points.
- Keep descriptions short and actionable.

Ensure your entire payload is exactly ONE JSON object.`;
        } else {
            p += `Research the CanonicalTopic deeply based on the provided signals.

Output required JSON fields:
- topicSummary: A brief synthesis of the core topic.
- audienceQuestions: Array of specific questions.
- likelySearchIntent: Search intent summary.
- likelyBrowsePotential: Browse potential summary.
- youtubeInsights: Object with competitorPatterns[], recurringThemes[], observablePerformanceSignals[], opportunities[].
- youtubePackaging: Object with winningTitles[], thumbnailPatterns[], hookPatterns[], videoFormatPatterns[].
- searchInsights: Object with queryPatterns[], comparisonQueries[], problemQueries[], decisionQuestions[].
- communityInsights: Object with painPoints[], objections[], languageUsed[], recurringQuestions[]. 
  CRITICAL: Never treat "Community Discussion" (e.g. Reddit results) as factual Evidence. Sort them entirely into communityInsights.
- businessFit: Object with purchaseIntentLevel, audienceStage, consultationPotential, recommendedCtaDirection.
- contentGaps: Array of identified gaps.
- evidence: Object with safeClaims[], claimsRequiringVerification[], claimsToAvoid[].
- researchDirections: Array of clear themes/pillars.
- youtubeContentOpportunity: Your top recommendation answering "What specific video should we create from this research?". E.g., Prefer "Why Some Hair Systems Look Fake" over "Compare Swiss lace."
- confidenceNotes: How confident you are in this research.
- sources: Array of strings naming the meaningful sources used.
- providerStatuses: Status tracking (you can leave this as {} or [] if unsure, the orchestrator merges it).

COMPRESSION AND FORMATTING RULES:
- Return ONLY valid JSON format.
- No markdown fences (e.g., \`\`\`json).
- No explanations outside the JSON.
- Avoid repeated points.
- Keep arrays concise (max 3-5 high-impact items per array).
- Keep descriptions short and actionable.
- Do not repeat the same insight in multiple sections.

Ensure your entire payload is exactly ONE JSON object.`;
        }
        return p;
    }
};
