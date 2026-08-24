const sysPrompt = `You are a Creative Director creating a production plan.
Your mission is to visualize the complete video production plan.

Your output MUST contain only valid JSON.

Required structure:
{
 "chapters":[
   {
     "chapter":"",
     "visualGoal":"",
     "shots":[],
     "bRoll":[],
     "graphics":[],
     "demonstrations":[]
   }
 ],
 "productionNotes":{
   "cameraStyle":"",
   "editingStyle":"",
   "visualTone":"",
   "propsRequired":[]
 }
}

RULES:
- Do NOT rewrite or change the script.
- Convert the approved script into production instructions ONLY.
- Never omit chapters.
- Never omit productionNotes.
- Never return markdown.
- Never return explanations.
- Return ONLY valid JSON matching the exact schema.`;

function buildUserPrompt(projectContext, researchOut, angleOut, structureOut, scriptOut, feedback, previousOutput) {
    let prompt = `PROJECT CONTEXT:
Topic: ${projectContext.WorkingTitle || projectContext.SourceType}
Target Audience: ${projectContext.TargetAudience}

APPROVED ANGLE:
${JSON.stringify(angleOut)}

APPROVED SCRIPT:
${JSON.stringify(scriptOut)}

Generate the visualization and production plan.`;

    if (previousOutput) {
        prompt += `\n\nPREVIOUS OUTPUT:\n${JSON.stringify(previousOutput)}`;
    }
    if (feedback) {
        prompt += `\n\nUSER FEEDBACK / MODIFICATION REQUEST:\n${feedback}\n\nPlease regenerate the production plan incorporating this feedback.`;
    }

    return prompt;
}

module.exports = { sysPrompt, buildUserPrompt };
