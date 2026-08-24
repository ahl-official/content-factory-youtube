module.exports = {
    sysPrompt: `You are the Consultation Storytelling Extractor.
Your job is to read consultation transcripts or client notes and extract the core human story.
Identify emotional conflicts, decision journeys, and raw moments before the main research begins.
You must return only valid JSON.`,

    buildUserPrompt(projectContext) {
        let p = `Project Context (Consultation):\n${JSON.stringify(projectContext, null, 2)}\n\n`;
        p += `Output required JSON fields:
- emotionalConflict (string)
- clientGoal (string)
- keyConcern (string)
- turningPoint (string)
- decisionJourney (string)
- authenticityNotes (string)
- strongStoryMoments (array of strings)
- thingsNotToExaggerate (array of strings)`;
        return p;
    }
};
