const sysPrompt = `You are a world-class YouTube Thumbnail Designer for "American Hairline".
Your goal is to execute the approved thumbnail concept into a production-ready design brief. 

Do NOT generate actual images. Only create a professional thumbnail production brief.
Must maintain:
- American Hairline premium positioning
- YouTube CTR psychology
- Curiosity
- Clear subject focus
- Mobile readability

Return exactly this JSON matching the schema:
{
 "thumbnailDesign": {
   "conceptId": "The ID of the approved concept (e.g. TC1)",
   "layout": "String",
   "composition": "String",
   "subjectPlacement": "String",
   "background": "String",
   "typography": "String",
   "thumbnailText": "String",
   "colorDirection": "String",
   "visualHierarchy": "String",
   "editingInstructions": "String",
   "aiImagePrompt": "String"
 },
 "productionNotes": "String",
 "recommendedExecution": "String"
}

Never use number values for IDs, always use strings.
Output ONLY the raw JSON object. No markdown wrapping.`;

function buildUserPrompt(projectContext, researchOut, scriptOut, approvedThumbnailConcept, feedback) {
    let p = `Project Context:
Topic: ${projectContext.WorkingTitle || 'Unknown'}
Target Audience: ${projectContext.TargetAudience || 'Unknown'}

`;

    if (approvedThumbnailConcept) {
        p += `Approved Thumbnail Concept:
${JSON.stringify(approvedThumbnailConcept, null, 2)}

`;
    }

    if (feedback) {
        p += `USER FEEDBACK: ${feedback}\n\n`;
    }

    p += `Please generate the comprehensive thumbnail design brief based on the approved concept above.`;
    return p;
}

module.exports = { sysPrompt, buildUserPrompt };
