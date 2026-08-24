const fs = require('fs');
const path = require('path');

const agents = {
    'researchAgent.js': 1,
    'contentAngleAgent.js': 2,
    'youtubeStrategistAgent.js': 3,
    'structureArchitectAgent.js': 4,
    'scriptWriterAgent.js': 5,
    'creativeDirectorAgent.js': 6,
    'thumbnailStrategistAgent.js': 7,
    'thumbnailDesignerAgent.js': 8,
    'titleStrategistAgent.js': 9,
    'seoAgent.js': 10,
    'editorAgent.js': 11,
    'retentionAgent.js': 12,
    'brandAgent.js': 13,
    'qcAgent.js': 14,
    'analyticsAgent.js': 15
};

const agentsDir = path.join(__dirname, 'youtube', 'agents');
for (const file of fs.readdirSync(agentsDir)) {
    if (agents[file]) {
        const filePath = path.join(agentsDir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // Replace import
        content = content.replace(
            "const { runOpenRouter } = require('../youtubeAgentRunner');",
            "const { generate } = require('../../services/ai/aiGenerator');"
        );

        // Replace function call. Regex matches runOpenRouter(sysPrompt, userPrompt, schema, isScript)
        content = content.replace(/runOpenRouter\(([^,]+),\s*([^,]+),\s*([^,]+)(?:,\s*(true|false))?\)/g, (match, sys, user, schema, isScript) => {
            if (isScript === undefined) {
                return `generate({ agentId: ${agents[file]}, sysPrompt: ${sys}, userPrompt: ${user}, schema: ${schema} })`;
            } else {
                return `generate({ agentId: ${agents[file]}, sysPrompt: ${sys}, userPrompt: ${user}, schema: ${schema}, isScript: ${isScript} })`;
            }
        });

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    }
}
