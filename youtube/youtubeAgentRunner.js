const config = require('../config');
const ytConfig = require('./youtubeAgentsConfig');
const logger = require('../logger');
const ytDb = require('./youtubeDatabase');

// PREVENT CIRCULAR DEPENDENCY: Export runOpenRouter before requiring agents that depend on it
module.exports.runOpenRouter = runOpenRouter;

// Agent Modules
const { runResearchAgent, runConsultationStory } = require('./agents/researchAgent');
const { runContentAngleAgent } = require('./agents/contentAngleAgent');
const { runStrategistAgent } = require('./agents/youtubeStrategistAgent');
const { runStructureAgent } = require('./agents/structureArchitectAgent');
const { runScriptAgent } = require('./agents/scriptWriterAgent');
const { runCreativeDirectorAgent } = require('./agents/creativeDirectorAgent');
const { runThumbnailStrategistAgent } = require('./agents/thumbnailStrategistAgent');
const { runThumbnailDesignerAgent } = require('./agents/thumbnailDesignerAgent');
const { runTitleStrategistAgent } = require('./agents/titleStrategistAgent');
const { runSeoAgent } = require('./agents/seoAgent');
const { runMetadataAgent } = require('./agents/metadataAgent');
const { runEditorAgent } = require('./agents/editorAgent');
const { runRetentionAgent } = require('./agents/retentionAgent');
const { runBrandAgent } = require('./agents/brandAgent');
const { runQcAgent } = require('./agents/qcAgent');
const { runAnalyticsAgent } = require('./agents/analyticsAgent');

const AGENT_KEYS = {
    1: 'research', 2: 'content_angle', 3: 'strategist', 4: 'structure', 5: 'script',
    6: 'creative_director', 7: 'thumbnail_strategist', 8: 'thumbnail_designer',
    9: 'title_strategist', 10: 'seo', 10.5: 'metadata', 11: 'editor', 12: 'retention',
    13: 'brand', 14: 'qc', 15: 'analytics'
};

const AGENT_NAMES = {
    1: 'Research Agent', 2: 'Content Angle Generator', 3: 'YouTube Strategist', 4: 'Video Structure Architect', 5: 'Script Writer',
    6: 'Creative Director', 7: 'Thumbnail Strategist', 8: 'Thumbnail Designer',
    9: 'Title Strategist', 10: 'SEO Agent', 10.5: 'Metadata Agent', 11: 'Video Editor', 12: 'Retention Analyst',
    13: 'Brand Consistency Agent', 14: 'Quality Control', 15: 'Analytics Agent'
};

async function runOpenRouter(sysPrompt, userPrompt, schema, isScript = false) {
    if (ytConfig.YT_AI_PROVIDER !== 'openrouter') throw new Error('Only OpenRouter is supported in Phase 3A');
    if (process.env.AI_MODE === 'development') throw new Error("AI_MODE=development is enabled. Switch to AI_MODE=production to generate new outputs.");

    const apiKey = process.env.OPENROUTER_API_KEY || config.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OpenRouter API key is missing');
    const model = process.env.YT_AI_MODEL || ytConfig.YT_AI_MODEL || 'openrouter/free';

    let maxTokens = isScript ? ytConfig.SCRIPT_MAX_TOKENS : ytConfig.DEFAULT_MAX_TOKENS;
    if (sysPrompt.includes("Research Agent") && !isScript) maxTokens = 6000;
    if (sysPrompt.includes("Title Strategist")) maxTokens = 1500;

    let responseText = '';
    let parsedJson = null;

    const { injectMemoryContext } = require('../services/memory/memoryRetriever');
    let agentNameMatch = sysPrompt.match(/You are the YouTube (.*?) agent/i) || sysPrompt.match(/You are the (.*?) Agent/i);
    let agentName = agentNameMatch ? agentNameMatch[1].trim() : 'Unknown';
    sysPrompt = injectMemoryContext(agentName, sysPrompt);

    for (let attempts = 0; attempts < 2; attempts++) {
        try {
            const fetch = (await import('node-fetch')).default || global.fetch;
            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'YouTube AI Agents'
                },
                body: JSON.stringify({
                    model: model,
                    temperature: ytConfig.TEMPERATURE,
                    max_tokens: maxTokens,
                    response_format: { type: "json_object" },
                    messages: [
                        { role: 'system', content: sysPrompt + '\n\nYou must respond in strict JSON format matching the required schema.' },
                        { role: 'user', content: userPrompt }
                    ]
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                if (res.status === 429 || errText.toLowerCase().includes('quota')) {
                    throw new Error("OpenRouter Quota Exhausted (429 Rate Limit). Please switch your provider or wait.");
                }
                throw new Error(`OpenRouter API Error: ${res.status} ${errText}`);
            }

            const data = await res.json();
            const choice = data.choices?.[0];
            responseText = choice?.message?.content;
            const finishReason = choice?.finish_reason;

            if (finishReason === 'length') {
                if (attempts === 0) {
                    sysPrompt += `\n\nERROR: Your previous response was truncated. Return the same JSON structure but compress descriptions significantly.`;
                    throw new Error("Truncated content");
                }
                throw new Error("Generation failed: Output consistently truncated.");
            }

            if (!responseText) throw new Error("Generation failed: Output consistently empty.");

            let cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
            let parsed;
            try {
                const firstBrace = cleanedText.indexOf('{');
                const lastBrace = cleanedText.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
                    cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
                }
                parsed = JSON.parse(cleanedText);
            } catch (err) {
                throw new Error("JSON Parse Error: " + err.message);
            }

            if (parsed.structure && !parsed.openingPromise) parsed = parsed.structure;
            if (parsed.videoStructure && !parsed.openingPromise) parsed = parsed.videoStructure;
            if (parsed.data && !parsed.openingPromise) parsed = parsed.data;

            try {
                parsedJson = schema.parse(parsed);
                return parsedJson;
            } catch (zodErr) {
                if (zodErr.errors) {
                    const errorSummary = zodErr.errors.map(err => `- ${err.path.join('.')}: ${err.message}`).join('\n');
                    throw new Error(`Structure validation failed:\n${errorSummary}`);
                }
                throw zodErr;
            }

        } catch (e) {
            const isRateLimit = e.message.includes('429') || e.message.includes('Quota');
            const isJsonError = e.message.includes('Structure validation failed') || e.message.includes('JSON Parse Error');
            const isTruncated = e.message.includes('Truncated content');

            if (isRateLimit) throw new Error("OpenRouter Quota Exhausted (429 Rate Limit). Please wait before generating again.");

            if (!isJsonError && !isTruncated) throw e;

            if (attempts === 1) throw new Error(`YouTube AI Agent generation failed structurally: ${e.message}`);
            sysPrompt += `\n\nERROR: Your previous response failed validation: ${e.message}. You MUST return ONLY a strictly valid flat JSON object.`;
        }
    }
}

async function getPreviousWorkflowData(projectId) {
    const runs = await ytDb.getAgentRuns(projectId);
    const getApprovedRunData = (agentKey) => {
        const approvedRuns = runs.filter(r => r.AgentKey === agentKey && (r.IsApproved === true || String(r.IsApproved) === 'true'));
        approvedRuns.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
        if (approvedRuns.length === 0) return null;
        try { return JSON.parse(approvedRuns[0].OutputData); } catch (e) { return approvedRuns[0].OutputData; }
    };

    return {
        runs,
        researchOut: getApprovedRunData('research'),
        angleOut: getApprovedRunData('content_angle'),
        strategistOut: getApprovedRunData('strategist'),
        structureOut: getApprovedRunData('structure'),
        scriptOut: getApprovedRunData('script')
    };
}

async function getProjectWithContext(projectId) {
    const project = await ytDb.getProject(projectId);
    if (!project) throw new Error('Project not found');
    const parsedProject = { ...project };
    if (parsedProject.TargetAudience) try { parsedProject.TargetAudience = JSON.parse(parsedProject.TargetAudience); } catch (e) { }
    return parsedProject;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED EXECUTION FUNCTION
// ─────────────────────────────────────────────────────────────────────────────
async function runAgentStep({ projectId, agentId, inputData }) {
    try {
        const agentKey = AGENT_KEYS[agentId];
        const agentName = AGENT_NAMES[agentId];
        if (!agentKey) throw new Error(`Unknown Agent ID: ${agentId}`);

        const project = await getProjectWithContext(projectId);
        const wf = await getPreviousWorkflowData(projectId);

        const getOutput = (key) => {
            const arr = wf.runs.filter(r => r.AgentKey === key && String(r.IsApproved) === 'true').sort((a, b) => b.Version - a.Version);
            if (!arr.length) return null;
            try { return JSON.parse(arr[0].OutputData); } catch (e) { return arr[0].OutputData; }
        };

        const getFinalTitle = () => {
            let tData = getOutput(AGENT_KEYS[9]); // Title Strategist output
            return tData?.titles?.find(t => t.id === tData.selectedTitleId)?.title || tData?.titles?.[0]?.title || "Unknown";
        };

        let output;
        let selectedAngleData = inputData.selectedAngleData;

        // Try load from topic registry if missing
        if (!selectedAngleData) {
            const topicInfo = await ytDb.getTopicRegistryEntry(projectId);
            if (topicInfo && topicInfo.Angle) {
                try { selectedAngleData = JSON.parse(topicInfo.Angle); } catch (e) { }
            }
        }

        // Cache-check logic
        const prevRuns = wf.runs.filter(r => r.AgentKey === agentKey);
        const version = prevRuns.length + 1;
        let targetVersion = inputData.version;
        if (!targetVersion && process.env.AI_MODE === 'development') {
            targetVersion = prevRuns.length > 0 ? prevRuns.length : null;
        }

        if (targetVersion) {
            const existing = prevRuns.find(r => String(r.Version) === String(targetVersion));
            if (existing && existing.OutputData) {
                let parsed;
                try { parsed = JSON.parse(existing.OutputData); } catch (e) { parsed = existing.OutputData; }
                return { success: true, agentId, output: parsed, nextAgent: agentId, status: 'Generated (Cached)', runRecord: existing };
            }
        }

        switch (Number(agentId)) {
            case 1:
                let consultationStoryData = null;
                if (String(project.IsConsultation) === 'TRUE' || project.SourceType === 'Consultation') {
                    consultationStoryData = await runConsultationStory(project);
                }
                output = await runResearchAgent(project, inputData.previousOutput, inputData.feedback, consultationStoryData);
                break;
            case 2:
                if (!wf.researchOut) throw new Error('Approved Research is required');
                output = await runContentAngleAgent(project, wf.researchOut, inputData.previousOutput, inputData.feedback, inputData.consultationStoryData);
                break;
            case 3:
                if (!wf.researchOut || !selectedAngleData) throw new Error('Approved Research and Angle required');
                output = await runStrategistAgent(project, wf.researchOut, selectedAngleData, inputData.sirFeedback, inputData.previousOutput, inputData.feedback, inputData.consultationStoryData);
                break;
            case 4:
                if (!wf.researchOut || !wf.strategistOut) throw new Error('Approved Research and Strategist required');
                output = await runStructureAgent(project, wf.researchOut, selectedAngleData, wf.strategistOut, inputData.sirAngleFeedback, inputData.previousOutput, inputData.feedback, inputData.consultationStoryData);
                break;
            case 5:
                if (!wf.researchOut || !wf.strategistOut || !wf.structureOut) throw new Error('Missing approved prior stages');
                output = await runScriptAgent(project, wf.researchOut, selectedAngleData, wf.strategistOut, wf.structureOut, inputData.sirAngleFeedback, inputData.sirStructureFeedback, inputData.previousOutput, inputData.feedback, inputData.consultationStoryData);
                break;
            case 6:
                if (!wf.researchOut || !wf.structureOut || !wf.scriptOut) throw new Error('Missing approved prior stages (Script required)');
                output = await runCreativeDirectorAgent(project, wf.researchOut, selectedAngleData, wf.structureOut, wf.scriptOut, inputData.feedback, inputData.previousOutput);
                break;
            case 7:
                if (!wf.researchOut || !wf.scriptOut) throw new Error('Missing approved Script phase');
                const creativeDirectorRuns = wf.runs.filter(r => r.AgentKey === AGENT_KEYS[6] && (r.IsApproved === true || String(r.IsApproved) === 'true')).sort((a, b) => b.Version - a.Version);
                let creativeDirectorOut = creativeDirectorRuns.length ? creativeDirectorRuns[0].OutputData : null;
                if (creativeDirectorOut) try { creativeDirectorOut = JSON.parse(creativeDirectorOut); } catch (e) { }
                output = await runThumbnailStrategistAgent(project, wf.researchOut, selectedAngleData, wf.scriptOut, creativeDirectorOut, inputData.feedback, inputData.previousOutput);
                break;
            case 8:
                const strats = wf.runs.filter(r => r.AgentKey === AGENT_KEYS[7] && (r.IsApproved === true || String(r.IsApproved) === 'true')).sort((a, b) => b.Version - a.Version);
                let approvedConcept = null;
                if (strats.length) {
                    try {
                        let parsed = JSON.parse(strats[0].OutputData);
                        approvedConcept = parsed.selectedConceptId ? parsed.thumbnailConcepts?.find(c => c.id === parsed.selectedConceptId) || parsed : parsed;
                    } catch (e) { }
                }
                output = await runThumbnailDesignerAgent(project, wf.researchOut, wf.scriptOut, approvedConcept, inputData.feedback, inputData.previousOutput);
                break;
            case 9:
                const designers = wf.runs.filter(r => r.AgentKey === AGENT_KEYS[8] && (r.IsApproved === true || String(r.IsApproved) === 'true')).sort((a, b) => b.Version - a.Version);
                let approvedDesign = null;
                if (designers.length) { try { approvedDesign = JSON.parse(designers[0].OutputData); } catch (e) { } }
                output = await runTitleStrategistAgent(project, wf.researchOut, wf.strategistOut, approvedDesign, inputData.feedback, inputData.previousOutput);
                break;
            case 10:
                const titles = wf.runs.filter(r => r.AgentKey === AGENT_KEYS[9] && (r.IsApproved === true || String(r.IsApproved) === 'true')).sort((a, b) => b.Version - a.Version);
                let finalTitle = "Unknown";
                if (titles.length) {
                    try {
                        let p = JSON.parse(titles[0].OutputData);
                        finalTitle = p.titles?.find(t => t.id === p.selectedAngleId || t.id === p.selectedTitleId)?.title || p.titles?.[0]?.title || "Unknown";
                    } catch (e) { }
                }
                output = await runSeoAgent(project, wf.researchOut, finalTitle, wf.scriptOut, null, inputData.feedback, inputData.previousOutput);
                break;
            case 10.5:
                let seoOut = wf.runs.filter(r => r.AgentKey === AGENT_KEYS[10] && (String(r.IsApproved) === 'true')).sort((a, b) => b.Version - a.Version)[0]?.OutputData || '{}';
                try { seoOut = JSON.parse(seoOut); } catch (e) { }
                let sd = typeof wf.scriptOut === 'string' ? JSON.parse(wf.scriptOut || '{}') : wf.scriptOut;
                output = await runMetadataAgent(project, { seo: seoOut, script: sd });
                break;
            case 11: {
                let prodPlan = getOutput(AGENT_KEYS[6]);
                let thumbC = getOutput(AGENT_KEYS[7]);
                let sPkg = getOutput(AGENT_KEYS[10]);
                output = await runEditorAgent(project, wf.scriptOut, prodPlan, thumbC, getFinalTitle(), sPkg, null, inputData.feedback, inputData.previousOutput);
                break;
            }
            case 12: {
                output = await runRetentionAgent(project, wf.scriptOut, getOutput(AGENT_KEYS[6]), getOutput(AGENT_KEYS[7]), getFinalTitle(), getOutput(AGENT_KEYS[10]), getOutput(AGENT_KEYS[11]), inputData.feedback);
                break;
            }
            case 13: {
                output = await runBrandAgent(project, wf.scriptOut, getOutput(AGENT_KEYS[7]), getFinalTitle(), getOutput(AGENT_KEYS[10]), getOutput(AGENT_KEYS[11]), inputData.feedback);
                break;
            }
            case 14: {
                output = await runQcAgent(project, wf.scriptOut, getOutput(AGENT_KEYS[6]), getOutput(AGENT_KEYS[7]), getFinalTitle(), getOutput(AGENT_KEYS[10]), getOutput(AGENT_KEYS[11]), getOutput(AGENT_KEYS[12]), getOutput(AGENT_KEYS[13]), inputData.feedback);
                break;
            }
            case 15: {
                const mockAnalytics = { views: "waiting", watchTime: "waiting", ctr: "waiting" };
                output = await runAnalyticsAgent(project, mockAnalytics, wf.scriptOut, getOutput(AGENT_KEYS[7]), getFinalTitle(), inputData.feedback);
                break;
            }
            default:
                throw new Error("Unknown agent stage");
        }

        const runRecord = await ytDb.createAgentRun({
            ProjectID: projectId,
            AgentKey: agentKey,
            AgentName: agentName,
            Version: version,
            InputData: inputData,
            OutputData: output,
            Status: 'Generated',
            IsApproved: false
        });

        // Stage updater
        await ytDb.updateProject(projectId, { CurrentStage: `${agentName} Review`, CurrentAgent: agentId });

        return {
            success: true,
            agentId,
            output,
            nextAgent: agentId,
            status: 'Generated',
            runRecord
        };
    } catch (e) {
        logger.error(`Error in runAgentStep: ${e.message}`);
        return { success: false, error: e.message };
    }
}

module.exports.runAgentStep = runAgentStep;
