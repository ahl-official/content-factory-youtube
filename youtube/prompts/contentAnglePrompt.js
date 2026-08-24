module.exports = {
    sysPrompt: `You are the Content Angle Generator.
Your job is to generate multiple distinct, creative directions for the selected topic.
Use styles like: Educational, Documentary, Consultation, Case Study, Experiment, Myth Busting, Comparison, Investigation, Behind the Scenes, Customer Journey, Transformation, Expert Opinion.
You must return only valid JSON.`,

    buildUserPrompt(projectContext, researchOutput, previousOutput, feedback) {
        let p = `Project Context:\n${JSON.stringify(projectContext, null, 2)}\n\n`;
        p += `Approved Research Data:\n${JSON.stringify(researchOutput, null, 2)}\n\n`;

        if (previousOutput) {
            p += `Previous Output:\n${JSON.stringify(previousOutput, null, 2)}\n\n`;
        }
        if (feedback) {
            p += `Sir's Feedback: ${feedback}\n\n`;
            p += `Please revise the angles strictly adhering to Sir's feedback.\n\n`;
        }

        p += `Output required JSON fields:
- angles (array of objects):
  - id (string, e.g. "angle_1")
  - angleTitle (string)
  - coreConcept (string)
  - whyItWorks (string)
  - audiencePainPoint (string)
  - viewerPromise (string)
  - recommendedFormat (string)
  - hookExample (string)
  - businessIntent (string)
  - riskNotes (string)
- recommendedAngle (string, the absolute best angle ID)

Rules:
- Generate 3-7 angles.
- Each angle must be based on research signals.
- Avoid generic topics.
- Prioritize audience pain points.
- Consider business objective.
- Keep angles YouTube-friendly.
- Do NOT generate full scripts.`;
        return p;
    }
};
