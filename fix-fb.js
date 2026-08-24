const fs = require('fs');

const path = 'c:/Users/HP/Desktop/Saniya/content-factory-work/content-factory/routes/youtubeAi.js';
let code = fs.readFileSync(path, 'utf8');

// Insert feedback saver
const fixStr = "const runRecord = await ytDb.createAgentRun({";

const insertStr = `
        if (feedback) {
            await ytDb.saveFeedback({
                ProjectID: req.params.id,
                Stage: AGENT_KEYS.RESEARCH,
                AgentKey: AGENT_KEYS.RESEARCH,
                Version: version,
                FeedbackType: 'AI_Revision',
                FeedbackText: feedback,
                Source: 'User',
                IsSirFeedback: false
            });
        }
        
        const runRecord = await ytDb.createAgentRun({`;

code = code.replace("const runRecord = await ytDb.createAgentRun({", insertStr);

fs.writeFileSync(path, code, 'utf8');
console.log("Updated youtubeAi.js research endpoint");
