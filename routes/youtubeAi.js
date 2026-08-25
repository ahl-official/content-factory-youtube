const express = require('express');
const router = express.Router();
const ytDb = require('../youtube/youtubeDatabase');
const logger = require('../logger');

// Agents
const { runResearchAgent, runConsultationStory } = require('../youtube/agents/researchAgent');
const { runContentAngleAgent } = require('../youtube/agents/contentAngleAgent');
const { runStrategistAgent } = require('../youtube/agents/youtubeStrategistAgent');
const { runStructureAgent } = require('../youtube/agents/structureArchitectAgent');
const { runScriptAgent } = require('../youtube/agents/scriptWriterAgent');
const { runCreativeDirectorAgent } = require('../youtube/agents/creativeDirectorAgent');
const { runThumbnailStrategistAgent } = require('../youtube/agents/thumbnailStrategistAgent');
const { runThumbnailDesignerAgent } = require('../youtube/agents/thumbnailDesignerAgent');
const { runTitleStrategistAgent } = require('../youtube/agents/titleStrategistAgent');
const { runSeoAgent } = require('../youtube/agents/seoAgent');
const { runEditorAgent } = require('../youtube/agents/editorAgent');
const { runRetentionAgent } = require('../youtube/agents/retentionAgent');
const { runBrandAgent } = require('../youtube/agents/brandAgent');
const { runQcAgent } = require('../youtube/agents/qcAgent');
const { runAnalyticsAgent } = require('../youtube/agents/analyticsAgent');

const AGENT_KEYS = {
    RESEARCH: 'research',
    ANGLE: 'content_angle',
    STRATEGIST: 'strategist',
    STRUCTURE: 'structure',
    SCRIPT: 'script',
    CREATIVE_DIRECTOR: 'creative_director',
    THUMBNAIL_STRATEGIST: 'thumbnail_strategist',
    THUMBNAIL_DESIGNER: 'thumbnail_designer',
    TITLE_STRATEGIST: 'title_strategist',
    SEO: 'seo',
    METADATA: 'metadata',
    EDITOR: 'editor',
    RETENTION: 'retention',
    BRAND: 'brand',
    QC: 'qc',
    ANALYTICS: 'analytics'
};

const AGENT_ORDER = Object.values(AGENT_KEYS);

// 2. Add agent output caching & 3. AI_MODE
router.use('/projects/:id/agents/:key/run', async (req, res, next) => {
    try {
        const projectId = req.params.id;
        const agentKey = req.params.key;

        const allRuns = await ytDb.getAgentRuns(projectId);
        const prevRuns = allRuns.filter(r => r.AgentKey === agentKey);

        const isDev = process.env.AI_MODE === 'development';
        let targetVersion = req.body.version;

        // In development mode, aggressively use the latest run to mock and protect quota
        if (!targetVersion && isDev) {
            targetVersion = prevRuns.length > 0 ? prevRuns.length : null;
        }

        // Before generating, check if the exact project + agent + version output already exists
        if (targetVersion) {
            const existing = prevRuns.find(r => String(r.Version) === String(targetVersion));
            if (existing && existing.OutputData) {
                logger.info(`[CACHE] Reusing DB run for ${agentKey} v${targetVersion} (AI_MODE: ${process.env.AI_MODE})`);
                let parsed;
                try { parsed = JSON.parse(existing.OutputData); } catch (e) { parsed = existing.OutputData; }
                return res.json({ output: parsed, runRecord: existing });
            }
        }
    } catch (err) {
        logger.error(`Cache middleware error: ${err.message}`);
    }
    next();
});

// Helper to get latest approved runs/versions safely
async function getPreviousWorkflowData(projectId) {
    const runs = await ytDb.getAgentRuns(projectId);

    // Sort logic to get newest runs
    // Actually we just need the most recently approved run for each past stage
    const getApprovedRunData = (agentKey) => {
        const approvedRuns = runs.filter(r => r.AgentKey === agentKey && (r.IsApproved === true || String(r.IsApproved) === 'true'));
        approvedRuns.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
        if (approvedRuns.length === 0) return null;
        try {
            return JSON.parse(approvedRuns[0].OutputData);
        } catch (e) {
            return approvedRuns[0].OutputData;
        }
    };

    return {
        runs,
        researchOut: getApprovedRunData(AGENT_KEYS.RESEARCH),
        angleOut: getApprovedRunData(AGENT_KEYS.ANGLE),
        strategistOut: getApprovedRunData(AGENT_KEYS.STRATEGIST),
        structureOut: getApprovedRunData(AGENT_KEYS.STRUCTURE),
        scriptOut: getApprovedRunData(AGENT_KEYS.SCRIPT)
    };
}

async function getProjectWithContext(projectId) {
    const project = await ytDb.getProject(projectId);
    if (!project) throw new Error('Project not found');

    // Parse JSON fields
    const parsedProject = { ...project };
    if (parsedProject.TargetAudience) try { parsedProject.TargetAudience = JSON.parse(parsedProject.TargetAudience); } catch (e) { }
    return parsedProject;
}

// GET /api/yt/dev/test-provider/:provider
router.get('/dev/test-provider/:provider', async (req, res) => {
    try {
        const { provider } = req.params;
        const q = req.query.q || 'Content Strategy';
        let moduleFn;

        switch (provider.toLowerCase()) {
            case 'youtube': moduleFn = require('../youtube/research/providers/youtubeProvider').runYouTubeResearch; break;
            case 'search': moduleFn = require('../youtube/research/providers/webSearchProvider').runWebSearch; break;
            case 'reddit': moduleFn = require('../youtube/research/providers/redditProvider').runRedditResearch; break;
            case 'evidence': moduleFn = require('../youtube/research/providers/evidenceProvider').runEvidenceResearch; break;
            case 'community-search': moduleFn = require('../youtube/research/researchOrchestrator').runCommunitySearch; break;
            default: return res.status(400).json({ error: 'Unknown provider' });
        }

        const result = await moduleFn(q);

        res.json({
            provider: result.provider,
            status: result.status,
            queryUsed: result.queryUsed,
            recordCount: result.records?.length || 0,
            warnings: result.warnings,
            preview: result.records?.slice(0, 2)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Validate Agent Keys
router.all('/projects/:id/agents/:agentKey/*', (req, res, next) => {
    const { agentKey } = req.params;
    if (agentKey === 'undefined' || !Object.values(AGENT_KEYS).includes(agentKey)) {
        return res.status(404).json({
            error: "Agent ID missing",
            availableAgents: Object.values(AGENT_KEYS)
        });
    }
    next();
});

// POST /api/yt/projects/:id/agents/research/run
router.post('/projects/:id/agents/research/run', async (req, res) => {
    try {
        const project = await getProjectWithContext(req.params.id);
        const { previousOutput, feedback } = req.body;

        let consultationStoryData = null;
        if (String(project.IsConsultation) === 'TRUE' || project.SourceType === 'Consultation') {
            consultationStoryData = await runConsultationStory(project);
        }

        const output = await runResearchAgent(project, previousOutput, feedback, consultationStoryData);

        // Find version
        const runs = await ytDb.getAgentRuns(req.params.id);
        const prevRuns = runs.filter(r => r.AgentKey === AGENT_KEYS.RESEARCH);
        const version = prevRuns.length + 1;

        const runRecord = await ytDb.createAgentRun({
            ProjectID: req.params.id,
            AgentKey: AGENT_KEYS.RESEARCH,
            AgentName: 'Research Agent',
            Version: version,
            InputData: { project, previousOutput, feedback, consultationStoryData },
            OutputData: output,
            Status: 'Generated',
            IsApproved: false
        });

        // Update Project Stage if it was lower
        await ytDb.updateProject(req.params.id, { CurrentStage: 'Research Review', CurrentAgent: 1 });

        // Parse and persist specific columns into YT_Research
        try {
            let parsed = typeof output === 'string' ? JSON.parse(output) : output;
            await ytDb.saveResearch({
                ProjectID: req.params.id,
                ResearchVersion: String(version),
                ResearchMode: 'Agent',
                CanonicalTopic: parsed.topicSummary || project.WorkingTitle,
                SourceType: project.SourceType,
                ResearchStatus: 'Generated',
                ResearchSummary: typeof parsed.topicSummary === 'string' ? parsed.topicSummary : JSON.stringify(parsed.topicSummary),
                TopicOpportunities: JSON.stringify(parsed.topicOpportunities),
                AudienceQuestions: JSON.stringify(parsed.audienceQuestions),
                YouTubeInsights: JSON.stringify(parsed.youtubeInsights),
                SearchInsights: JSON.stringify(parsed.searchInsights),
                CommunityInsights: JSON.stringify(parsed.communityInsights),
                ContentGaps: JSON.stringify(parsed.contentGaps),
                Evidence: JSON.stringify(parsed.evidence),
                ResearchDirections: JSON.stringify(parsed.researchDirections),
                RecommendedOpportunity: parsed.recommendedResearchOpportunity || parsed.youtubeContentOpportunity,
                Sources: JSON.stringify(parsed.sources),
                ProviderStatuses: JSON.stringify(parsed.providerStatuses),
                Approved: 'False'
            });
        } catch (e) {
            logger.error({ err: e }, "Failed to extract and save parsed YT_Research data");
        }

        res.json({ output, runRecord });
    } catch (err) {
        logger.error({ err }, 'Research run error');
        res.status(500).json({ error: err.message });
    }
});

router.post('/projects/:id/agents/content_angle/run', async (req, res) => {
    try {
        const project = await getProjectWithContext(req.params.id);
        const { previousOutput, feedback } = req.body;
        const wf = await getPreviousWorkflowData(req.params.id);

        if (!wf.researchOut) throw new Error('Approved Research is required before generating angles');

        let consultationStoryData = null;
        if (String(project.IsConsultation) === 'TRUE' || project.SourceType === 'Consultation') {
            const consRuns = await ytDb.getAgentRuns(req.params.id);
            // We didn't explicitly store consultation story earlier except in research input. Let's just regenerate it or pull from research input. 
            // Better: run it again or fetch from latest research run InputData.
            const latestResearch = wf.runs.filter(r => r.AgentKey === AGENT_KEYS.RESEARCH).pop();
            if (latestResearch) {
                try {
                    const inputD = JSON.parse(latestResearch.InputData);
                    consultationStoryData = inputD.consultationStoryData;
                } catch (e) { }
            }
        }

        const output = await runContentAngleAgent(project, wf.researchOut, previousOutput, feedback, consultationStoryData);

        const prevRuns = wf.runs.filter(r => r.AgentKey === AGENT_KEYS.ANGLE);
        const version = prevRuns.length + 1;

        const runRecord = await ytDb.createAgentRun({
            ProjectID: req.params.id,
            AgentKey: AGENT_KEYS.ANGLE,
            AgentName: 'Content Angle Generator',
            Version: version,
            InputData: { project, researchOut: wf.researchOut, previousOutput, feedback, consultationStoryData },
            OutputData: output,
            Status: 'Generated',
            IsApproved: false
        });

        await ytDb.updateProject(req.params.id, { CurrentStage: 'Content Angles', CurrentAgent: 2 });
        res.json({ output, runRecord });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/projects/:id/agents/strategist/run', async (req, res) => {
    try {
        const project = await getProjectWithContext(req.params.id);
        const { previousOutput, feedback } = req.body;
        const wf = await getPreviousWorkflowData(req.params.id);

        if (!wf.researchOut) throw new Error('Approved Research required');

        let selectedAngleData = req.body.selectedAngleData;
        const topicInfo = await ytDb.getTopicRegistryEntry(req.params.id);

        if (!selectedAngleData && topicInfo && topicInfo.Angle) {
            try { selectedAngleData = JSON.parse(topicInfo.Angle); } catch (e) { }
        }

        const sirFeedback = req.body.sirFeedback; // passed from UI

        if (!selectedAngleData) throw new Error('Selected angle is required');

        const output = await runStrategistAgent(project, wf.researchOut, selectedAngleData, sirFeedback, previousOutput, feedback, req.body.consultationStoryData);

        const prevRuns = wf.runs.filter(r => r.AgentKey === AGENT_KEYS.STRATEGIST);
        const version = prevRuns.length + 1;

        const runRecord = await ytDb.createAgentRun({
            ProjectID: req.params.id,
            AgentKey: AGENT_KEYS.STRATEGIST,
            AgentName: 'YouTube Strategist',
            Version: version,
            InputData: { project, selectedAngleData, sirFeedback },
            OutputData: output,
            Status: 'Generated',
            IsApproved: false
        });

        await ytDb.updateProject(req.params.id, { CurrentStage: 'YouTube Strategy', CurrentAgent: 3 });
        res.json({ output, runRecord });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/projects/:id/agents/structure/run', async (req, res) => {
    try {
        const project = await getProjectWithContext(req.params.id);
        const { previousOutput, feedback, sirAngleFeedback } = req.body;
        let selectedAngleData = req.body.selectedAngleData;
        const topicInfo = await ytDb.getTopicRegistryEntry(req.params.id);
        if (!selectedAngleData && topicInfo && topicInfo.Angle) {
            try { selectedAngleData = JSON.parse(topicInfo.Angle); } catch (e) { }
        }

        const wf = await getPreviousWorkflowData(req.params.id);

        if (!wf.researchOut || !wf.strategistOut) throw new Error('Approved Research and Strategist required');

        const output = await runStructureAgent(project, wf.researchOut, selectedAngleData, wf.strategistOut, sirAngleFeedback, previousOutput, feedback, req.body.consultationStoryData);

        const prevRuns = wf.runs.filter(r => r.AgentKey === AGENT_KEYS.STRUCTURE);
        const version = prevRuns.length + 1;

        const runRecord = await ytDb.createAgentRun({
            ProjectID: req.params.id,
            AgentKey: AGENT_KEYS.STRUCTURE,
            AgentName: 'Video Structure Architect',
            Version: version,
            InputData: { project, strategistOut: wf.strategistOut, selectedAngleData },
            OutputData: output,
            Status: 'Generated',
            IsApproved: false
        });

        await ytDb.updateProject(req.params.id, { CurrentStage: 'Structure Review', CurrentAgent: 4 });
        res.json({ output, runRecord });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/projects/:id/agents/script/run', async (req, res) => {
    try {
        const project = await getProjectWithContext(req.params.id);
        const { previousOutput, feedback, sirAngleFeedback, sirStructureFeedback } = req.body;

        let selectedAngleData = req.body.selectedAngleData;
        const topicInfo = await ytDb.getTopicRegistryEntry(req.params.id);
        if (!selectedAngleData && topicInfo && topicInfo.Angle) {
            try { selectedAngleData = JSON.parse(topicInfo.Angle); } catch (e) { }
        }

        const wf = await getPreviousWorkflowData(req.params.id);

        if (!wf.researchOut || !wf.strategistOut || !wf.structureOut) throw new Error('Missing approved prior stages');

        const output = await runScriptAgent(project, wf.researchOut, selectedAngleData, wf.strategistOut, wf.structureOut, sirAngleFeedback, sirStructureFeedback, previousOutput, feedback, req.body.consultationStoryData);

        const prevRuns = wf.runs.filter(r => r.AgentKey === AGENT_KEYS.SCRIPT);
        const version = prevRuns.length + 1;

        const runRecord = await ytDb.createAgentRun({
            ProjectID: req.params.id,
            AgentKey: AGENT_KEYS.SCRIPT,
            AgentName: 'Script Writer',
            Version: version,
            InputData: { project, structureOut: wf.structureOut },
            OutputData: output,
            Status: 'Generated',
            IsApproved: false
        });

        // Also add row to YT_Scripts specifically as requested by schema
        await ytDb.saveScriptVersion({
            ProjectID: req.params.id,
            Version: version,
            ScriptText: output.fullScript,
            BasedOnRunID: runRecord.RunID,
            FeedbackSummary: feedback || '',
            IsApproved: false
        });

        await ytDb.updateProject(req.params.id, { CurrentStage: 'Script Writing', CurrentAgent: 5 });
        res.json({ output, runRecord });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/projects/:id/agents/creative_director/run', async (req, res) => {
    try {
        const project = await getProjectWithContext(req.params.id);
        const { previousOutput, feedback } = req.body;

        let selectedAngleData = req.body.selectedAngleData;
        const topicInfo = await ytDb.getTopicRegistryEntry(req.params.id);
        if (!selectedAngleData && topicInfo && topicInfo.Angle) {
            try { selectedAngleData = JSON.parse(topicInfo.Angle); } catch (e) { }
        }

        const wf = await getPreviousWorkflowData(req.params.id);

        if (!wf.researchOut || !wf.structureOut || !wf.scriptOut) throw new Error('Missing approved prior stages (Script required)');

        const output = await runCreativeDirectorAgent(project, wf.researchOut, selectedAngleData, wf.structureOut, wf.scriptOut, feedback, previousOutput);

        const prevRuns = wf.runs.filter(r => r.AgentKey === AGENT_KEYS.CREATIVE_DIRECTOR);
        const version = prevRuns.length + 1;

        const runRecord = await ytDb.createAgentRun({
            ProjectID: req.params.id,
            AgentKey: AGENT_KEYS.CREATIVE_DIRECTOR,
            AgentName: 'Creative Director',
            Version: version,
            InputData: { project, scriptOut: wf.scriptOut },
            OutputData: output,
            Status: 'Generated',
            IsApproved: false
        });

        await ytDb.upsertAgentArtifact({
            sheetName: 'YT_CreativePlan',
            projectId: req.params.id,
            agentId: 6,
            version: version,
            inputSnapshot: { scriptOut: wf.scriptOut },
            outputJson: output,
            status: 'Generated'
        });

        await ytDb.updateProject(req.params.id, { CurrentStage: 'Production Phase', CurrentAgent: 6 });
        res.json({ output, runRecord });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/projects/:id/agents/thumbnail_strategist/run', async (req, res) => {
    try {
        const project = await getProjectWithContext(req.params.id);
        const { previousOutput, feedback } = req.body;

        let selectedAngleData = req.body.selectedAngleData;
        const topicInfo = await ytDb.getTopicRegistryEntry(req.params.id);
        if (!selectedAngleData && topicInfo && topicInfo.Angle) {
            try { selectedAngleData = JSON.parse(topicInfo.Angle); } catch (e) { }
        }

        const wf = await getPreviousWorkflowData(req.params.id);

        if (!wf.researchOut || !wf.scriptOut) throw new Error('Missing approved prior stages (Script required)');

        const creativeDirectorRuns = wf.runs.filter(r => r.AgentKey === AGENT_KEYS.CREATIVE_DIRECTOR && (r.IsApproved === true || String(r.IsApproved) === 'true'));
        creativeDirectorRuns.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
        let creativeDirectorOut = null;
        if (creativeDirectorRuns.length > 0) {
            try { creativeDirectorOut = JSON.parse(creativeDirectorRuns[0].OutputData); } catch (e) { creativeDirectorOut = creativeDirectorRuns[0].OutputData; }
        }

        const output = await runThumbnailStrategistAgent(project, wf.researchOut, selectedAngleData, wf.scriptOut, creativeDirectorOut, feedback, previousOutput);

        const prevRuns = wf.runs.filter(r => r.AgentKey === AGENT_KEYS.THUMBNAIL_STRATEGIST);
        const version = prevRuns.length + 1;

        const runRecord = await ytDb.createAgentRun({
            ProjectID: req.params.id,
            AgentKey: AGENT_KEYS.THUMBNAIL_STRATEGIST,
            AgentName: 'Thumbnail Strategist',
            Version: version,
            InputData: { project, creativeDirectorOut },
            OutputData: output,
            Status: 'Generated',
            IsApproved: false
        });

        await ytDb.upsertAgentArtifact({
            sheetName: 'YT_ThumbnailConcepts',
            projectId: req.params.id,
            agentId: 7,
            version: version,
            inputSnapshot: { creativeDirectorOut },
            outputJson: output,
            status: 'Generated'
        });

        await ytDb.updateProject(req.params.id, { CurrentStage: 'Thumbnail Strategy Review', CurrentAgent: 7 });
        res.json({ output, runRecord });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// AGENT 8: THUMBNAIL DESIGNER
router.post('/projects/:id/agents/thumbnail_designer/run', async (req, res) => {
    try {
        const project = await getProjectWithContext(req.params.id);
        const { previousOutput, feedback } = req.body;
        const wf = await getPreviousWorkflowData(req.params.id);

        if (!wf.researchOut || !wf.scriptOut) throw new Error('Missing approved prior stages');

        // Fetch Approved Thumbnail Concept
        const strategists = await ytDb.getAgentRuns(req.params.id);
        const approvedStrategistRuns = strategists.filter(r => r.AgentKey === AGENT_KEYS.THUMBNAIL_STRATEGIST && String(r.IsApproved) === 'true');
        approvedStrategistRuns.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
        let approvedConcept = null;

        if (approvedStrategistRuns.length > 0) {
            try {
                let parsed = typeof approvedStrategistRuns[0].OutputData === 'string' ? JSON.parse(approvedStrategistRuns[0].OutputData) : approvedStrategistRuns[0].OutputData;
                if (parsed.selectedConceptId) {
                    approvedConcept = parsed.thumbnailConcepts?.find(c => c.id === parsed.selectedConceptId) || parsed;
                } else {
                    approvedConcept = parsed;
                }
            } catch (e) { }
        }

        const output = await runThumbnailDesignerAgent(project, wf.researchOut, wf.scriptOut, approvedConcept, feedback, previousOutput);

        const prevRuns = wf.runs.filter(r => r.AgentKey === AGENT_KEYS.THUMBNAIL_DESIGNER);
        const version = prevRuns.length + 1;

        const runRecord = await ytDb.createAgentRun({
            ProjectID: req.params.id,
            AgentKey: AGENT_KEYS.THUMBNAIL_DESIGNER,
            AgentName: 'Thumbnail Designer',
            Version: version,
            InputData: { approvedConcept },
            OutputData: output,
            Status: 'Generated',
            IsApproved: false
        });

        await ytDb.upsertAgentArtifact({
            sheetName: 'YT_ThumbnailDesign',
            projectId: req.params.id,
            agentId: 8,
            version: version,
            inputSnapshot: { approvedConcept },
            outputJson: output,
            status: 'Generated'
        });

        await ytDb.updateProject(req.params.id, { CurrentStage: 'Thumbnail Design Review', CurrentAgent: 8 });
        res.json({ output, runRecord });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// AGENT 9: TITLE STRATEGIST
router.post('/projects/:id/agents/title_strategist/run', async (req, res) => {
    try {
        const project = await getProjectWithContext(req.params.id);
        const { previousOutput, feedback } = req.body;
        const wf = await getPreviousWorkflowData(req.params.id);

        // Thumbnail text usually from approved Agent 8
        const designers = await ytDb.getAgentRuns(req.params.id);
        const approvedDesignerRuns = designers.filter(r => r.AgentKey === AGENT_KEYS.THUMBNAIL_DESIGNER && String(r.IsApproved) === 'true');
        approvedDesignerRuns.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
        let approvedDesign = null;
        if (approvedDesignerRuns.length > 0) {
            try { approvedDesign = JSON.parse(approvedDesignerRuns[0].OutputData); } catch (e) { approvedDesign = approvedDesignerRuns[0].OutputData; }
        }

        const output = await runTitleStrategistAgent(project, wf.researchOut, wf.strategistOut, approvedDesign, feedback, previousOutput);

        const prevRuns = wf.runs.filter(r => r.AgentKey === AGENT_KEYS.TITLE_STRATEGIST);
        const version = prevRuns.length + 1;

        const runRecord = await ytDb.createAgentRun({
            ProjectID: req.params.id,
            AgentKey: AGENT_KEYS.TITLE_STRATEGIST,
            AgentName: 'Title Strategist',
            Version: version,
            InputData: { approvedDesign },
            OutputData: output,
            Status: 'Generated',
            IsApproved: false
        });

        await ytDb.upsertAgentArtifact({
            sheetName: 'YT_TitleOptions',
            projectId: req.params.id,
            agentId: 9,
            version: version,
            inputSnapshot: { approvedDesign },
            outputJson: output,
            status: 'Generated'
        });

        await ytDb.updateProject(req.params.id, { CurrentStage: 'Title Strategy Review', CurrentAgent: 9 });
        res.json({ output, runRecord });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// AGENT 10: SEO PACKAGE
router.post('/projects/:id/agents/seo/run', async (req, res) => {
    try {
        const project = await getProjectWithContext(req.params.id);
        const { previousOutput, feedback } = req.body;
        const wf = await getPreviousWorkflowData(req.params.id);

        // Fetch Final Title
        const titles = await ytDb.getAgentRuns(req.params.id);
        const approvedTitleRuns = titles.filter(r => r.AgentKey === AGENT_KEYS.TITLE_STRATEGIST && String(r.IsApproved) === 'true');
        approvedTitleRuns.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
        let finalTitle = "Unknown";
        if (approvedTitleRuns.length > 0) {
            try {
                let parsed = typeof approvedTitleRuns[0].OutputData === 'string' ? JSON.parse(approvedTitleRuns[0].OutputData) : approvedTitleRuns[0].OutputData;
                let recommended = parsed.titles?.find(t => t.id === parsed.selectedAngleId || t.id === parsed.selectedTitleId) || parsed.titles?.[0];
                if (recommended) finalTitle = recommended.title;
            } catch (e) { }
        }

        // Fetch Designer Output
        const designers = await ytDb.getAgentRuns(req.params.id);
        const approvedDesignerRuns = designers.filter(r => r.AgentKey === AGENT_KEYS.THUMBNAIL_DESIGNER && String(r.IsApproved) === 'true');
        approvedDesignerRuns.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
        let approvedDesign = null;
        if (approvedDesignerRuns.length > 0) {
            try { approvedDesign = JSON.parse(approvedDesignerRuns[0].OutputData); } catch (e) { approvedDesign = approvedDesignerRuns[0].OutputData; }
        }

        const output = await runSeoAgent(project, wf.researchOut, finalTitle, wf.scriptOut, approvedDesign, feedback, previousOutput);

        const prevRuns = wf.runs.filter(r => r.AgentKey === AGENT_KEYS.SEO);
        const version = prevRuns.length + 1;

        const runRecord = await ytDb.createAgentRun({
            ProjectID: req.params.id,
            AgentKey: AGENT_KEYS.SEO,
            AgentName: 'SEO Package',
            Version: version,
            InputData: { finalTitle },
            OutputData: output,
            Status: 'Generated',
            IsApproved: false
        });

        await ytDb.upsertAgentArtifact({
            sheetName: 'YT_SEOPackage',
            projectId: req.params.id,
            agentId: 10,
            version: version,
            inputSnapshot: { finalTitle },
            outputJson: output,
            status: 'Generated'
        });

        await ytDb.updateProject(req.params.id, { CurrentStage: 'SEO Setup Review', CurrentAgent: 10 });
        res.json({ output, runRecord });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// AGENT 10.5: METADATA PACKAGE
router.post('/projects/:id/agents/metadata/run', async (req, res) => {
    try {
        const project = await getProjectWithContext(req.params.id);
        const wf = await getPreviousWorkflowData(req.params.id);

        const seoOut = wf.runs.slice().reverse().find(r => r.AgentKey === AGENT_KEYS.SEO && String(r.IsApproved) === 'true')?.OutputData || {};
        let parsedSeo = typeof seoOut === 'string' ? JSON.parse(seoOut || '{}') : seoOut;

        let scriptData = typeof wf.scriptOut === 'string' ? JSON.parse(wf.scriptOut || '{}') : wf.scriptOut;

        const agentData = { seo: parsedSeo, script: scriptData };

        const { runMetadataAgent } = require('../youtube/agents/metadataAgent');
        const output = await runMetadataAgent(project, agentData);

        const prevRuns = wf.runs.filter(r => r.AgentKey === AGENT_KEYS.METADATA);
        const version = prevRuns.length + 1;

        const runRecord = await ytDb.createAgentRun({
            ProjectID: req.params.id,
            AgentKey: AGENT_KEYS.METADATA,
            AgentName: 'Metadata Agent',
            Version: version,
            InputData: agentData,
            OutputData: output,
            Status: 'Generated',
            IsApproved: false
        });

        await ytDb.updateProject(req.params.id, { CurrentStage: 'Metadata Review', CurrentAgent: 10.5 });
        res.json({ output, runRecord });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Run Video Editor Agent (Agent 11)
router.post('/projects/:id/agents/editor/run', async (req, res) => {
    try {
        const { feedback } = req.body;
        const project = await ytDb.getProject(req.params.id);
        const wf = await getPreviousWorkflowData(req.params.id);

        let previousOutput = null;
        if (wf.runs) {
            const editorRuns = wf.runs.filter(r => r.AgentKey === AGENT_KEYS.EDITOR).sort((a, b) => b.Version - a.Version);
            if (editorRuns.length > 0) {
                try { previousOutput = JSON.parse(editorRuns[0].OutputData); } catch (e) { previousOutput = editorRuns[0].OutputData; }
            }
        }

        // Fetch Creative Director (Production Plan)
        let prodPlan = null;
        if (wf.runs) {
            const prodRuns = wf.runs.filter(r => r.AgentKey === AGENT_KEYS.CREATIVE_DIRECTOR && String(r.IsApproved) === 'true').sort((a, b) => b.Version - a.Version);
            if (prodRuns.length > 0) {
                try { prodPlan = JSON.parse(prodRuns[0].OutputData); } catch (e) { prodPlan = prodRuns[0].OutputData; }
            }
        }

        // Fetch Retention Review (if available) - Agent 12
        let retentionReview = null;
        if (wf.runs) {
            const retRuns = wf.runs.filter(r => r.AgentKey === AGENT_KEYS.RETENTION).sort((a, b) => b.Version - a.Version);
            if (retRuns.length > 0) {
                try { retentionReview = JSON.parse(retRuns[0].OutputData); } catch (e) { retentionReview = retRuns[0].OutputData; }
            }
        }

        // Titles
        const titles = await ytDb.getAgentRuns(req.params.id);
        const approvedTitleRuns = titles.filter(r => r.AgentKey === AGENT_KEYS.TITLE_STRATEGIST && String(r.IsApproved) === 'true');
        approvedTitleRuns.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
        let finalTitle = "Unknown";
        if (approvedTitleRuns.length > 0) {
            try {
                let parsed = typeof approvedTitleRuns[0].OutputData === 'string' ? JSON.parse(approvedTitleRuns[0].OutputData) : approvedTitleRuns[0].OutputData;
                let recommended = parsed.titles?.find(t => t.id === parsed.selectedAngleId || t.id === parsed.selectedTitleId) || parsed.titles?.[0];
                if (recommended) finalTitle = recommended.title;
            } catch (e) { }
        }

        // Fetch SEO Package
        let seoPackage = null;
        if (wf.runs) {
            const seoRuns = wf.runs.filter(r => r.AgentKey === AGENT_KEYS.SEO && String(r.IsApproved) === 'true').sort((a, b) => b.Version - a.Version);
            if (seoRuns.length > 0) {
                try { seoPackage = JSON.parse(seoRuns[0].OutputData); } catch (e) { seoPackage = seoRuns[0].OutputData; }
            }
        }

        // Fetch Thumbnail Concept
        let thumbConcept = null;
        if (wf.runs) {
            const thumbRuns = wf.runs.filter(r => r.AgentKey === AGENT_KEYS.THUMBNAIL_STRATEGIST && String(r.IsApproved) === 'true').sort((a, b) => b.Version - a.Version);
            if (thumbRuns.length > 0) {
                try {
                    let parsed = JSON.parse(thumbRuns[0].OutputData);
                    thumbConcept = parsed.thumbnailConcepts?.find(c => c.id === parsed.selectedAngleId) || parsed.thumbnailConcepts?.[0] || parsed;
                } catch (e) { thumbConcept = thumbRuns[0].OutputData; }
            }
        }

        const output = await runEditorAgent(project, wf.scriptOut, prodPlan, thumbConcept, finalTitle, seoPackage, retentionReview, feedback, previousOutput);

        const prevRuns = wf.runs.filter(r => r.AgentKey === AGENT_KEYS.EDITOR);
        const version = prevRuns.length + 1;

        const runRecord = await ytDb.createAgentRun({
            ProjectID: req.params.id,
            AgentKey: AGENT_KEYS.EDITOR,
            AgentName: 'Video Editor',
            Version: version,
            InputData: { finalTitle, hasProdPlan: !!prodPlan },
            OutputData: output,
            Status: 'Generated',
            IsApproved: false
        });

        await ytDb.upsertAgentArtifact({
            sheetName: 'YT_EditPlan',
            projectId: req.params.id,
            agentId: 11,
            version: version,
            inputSnapshot: { finalTitle, hasProdPlan: !!prodPlan },
            outputJson: output,
            status: 'Generated'
        });

        await ytDb.updateProject(req.params.id, { CurrentStage: 'Editor Plan Generation', CurrentAgent: 11 });
        res.json({ output, runRecord });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Run Agents 12-15
const reviewAgents = [
    { key: AGENT_KEYS.RETENTION, name: 'Retention Analyst', id: 12, runner: runRetentionAgent, sheet: 'YT_RetentionReview' },
    { key: AGENT_KEYS.BRAND, name: 'Brand Consistency Agent', id: 13, runner: runBrandAgent, sheet: 'YT_BrandReview' },
    { key: AGENT_KEYS.QC, name: 'Quality Control', id: 14, runner: runQcAgent, sheet: 'YT_QCReview' },
    { key: AGENT_KEYS.ANALYTICS, name: 'Analytics Agent', id: 15, runner: runAnalyticsAgent, sheet: 'YT_Analytics' }
];

reviewAgents.forEach(agent => {
    router.post(`/projects/:id/agents/${agent.key}/run`, async (req, res) => {
        try {
            const { feedback } = req.body;
            const project = await ytDb.getProject(req.params.id);
            const wf = await getPreviousWorkflowData(req.params.id);

            // Fetch generic approved data based on workflow runs inside `getPreviousWorkflowData` manually.
            // But we don't have all data there, let's fetch everything manually just like Editor does.
            const allRuns = await ytDb.getAgentRuns(req.params.id);

            const getOutput = (key) => {
                const arr = allRuns.filter(r => r.AgentKey === key && String(r.IsApproved) === 'true').sort((a, b) => b.Version - a.Version);
                if (!arr.length) return null;
                try { return JSON.parse(arr[0].OutputData); } catch (e) { return arr[0].OutputData; }
            };

            const prodPlan = getOutput(AGENT_KEYS.CREATIVE_DIRECTOR);
            const thumbConcept = getOutput(AGENT_KEYS.THUMBNAIL_STRATEGIST);
            let finalTitle = "Unknown";
            const titleAgentOutput = getOutput(AGENT_KEYS.TITLE_STRATEGIST);
            if (titleAgentOutput && titleAgentOutput.titles) {
                const rec = titleAgentOutput.titles.find(t => t.id === titleAgentOutput.selectedAngleId || t.id === titleAgentOutput.selectedTitleId) || titleAgentOutput.titles[0];
                if (rec) finalTitle = rec.title;
            }
            const seoPackage = getOutput(AGENT_KEYS.SEO);
            const editorPlan = getOutput(AGENT_KEYS.EDITOR);
            const retentionReview = getOutput(AGENT_KEYS.RETENTION);
            const brandReview = getOutput(AGENT_KEYS.BRAND);
            const scriptOut = getOutput(AGENT_KEYS.SCRIPT);

            let output;
            if (agent.id === 12) {
                output = await agent.runner(project, scriptOut, prodPlan, thumbConcept, finalTitle, seoPackage, editorPlan, feedback);
            } else if (agent.id === 13) {
                output = await agent.runner(project, scriptOut, thumbConcept, finalTitle, seoPackage, editorPlan, feedback);
            } else if (agent.id === 14) {
                output = await agent.runner(project, scriptOut, prodPlan, thumbConcept, finalTitle, seoPackage, editorPlan, retentionReview, brandReview, feedback);
            } else if (agent.id === 15) {
                // we mock analyticsData for now just to connect the pipeline
                const analyticsData = { views: "waiting", watchTime: "waiting", ctr: "waiting" };
                output = await agent.runner(project, analyticsData, scriptOut, thumbConcept, finalTitle, feedback);
            }

            const agentRuns = allRuns.filter(r => r.AgentKey === agent.key);
            const version = agentRuns.length + 1;

            const runRecord = await ytDb.createAgentRun({
                ProjectID: req.params.id,
                AgentKey: agent.key,
                AgentName: agent.name,
                Version: version,
                InputData: { runDate: new Date().toISOString() },
                OutputData: output,
                Status: 'Generated',
                IsApproved: false
            });

            await ytDb.upsertAgentArtifact({
                sheetName: agent.sheet,
                projectId: req.params.id,
                agentId: agent.id,
                version: version,
                inputSnapshot: { finalTitle, generatedDate: new Date().toISOString() },
                outputJson: output,
                status: 'Generated'
            });

            await ytDb.updateProject(req.params.id, { CurrentStage: `${agent.name} Output Generated`, CurrentAgent: agent.id });
            res.json({ output, runRecord });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    });
});

// Approvals
router.post('/projects/:id/agents/:agentKey/approve', async (req, res) => {
    try {
        const { agentKey } = req.params;
        const { runId, selectedAngleData } = req.body;

        const runs = await ytDb.getAgentRuns(req.params.id);
        const targetRun = runs.find(r => r.RunID === runId);
        if (!targetRun) throw new Error('Run not found');

        // Note: YT_AgentRuns does not have an easy updateRow api in our youtubeDatabase.js.
        // Since google-spreadsheet allows row.save(), we should ideally fetch the row directly.
        // Wait, youtubeDatabase.js `updateProject` works but not `updateAgentRun`.
        // Let's implement updateAgentRun in youtubeDatabase.js or just push another "approved payload"?
        // No, the system expects `updateAgentRun` to exist. 
        if ([AGENT_KEYS.RESEARCH, AGENT_KEYS.STRATEGIST, AGENT_KEYS.CREATIVE_DIRECTOR, AGENT_KEYS.THUMBNAIL_STRATEGIST, AGENT_KEYS.THUMBNAIL_DESIGNER, AGENT_KEYS.TITLE_STRATEGIST, AGENT_KEYS.SEO, AGENT_KEYS.EDITOR, AGENT_KEYS.RETENTION, AGENT_KEYS.BRAND, AGENT_KEYS.QC, AGENT_KEYS.ANALYTICS].includes(agentKey)) {
            const success = await ytDb.approveAgentRun(req.params.id, runId, req.body.selectedAngleId);
        }

        if (agentKey === AGENT_KEYS.RESEARCH) {
            await ytDb.updateProject(req.params.id, { CurrentStage: 'Content Angle', CurrentAgent: '2', Progress: '1' });
            try {
                let parsedOutput = targetRun.OutputData;
                try { parsedOutput = JSON.parse(targetRun.OutputData); } catch (e) { }

                await ytDb.saveResearch({
                    ProjectID: req.params.id,
                    Topic: parsedOutput?.topicSummary || 'Approved Research Compilation',
                    SourceType: 'Agent Generation',
                    SourceTitle: 'Research Agent output',
                    Insight: typeof parsedOutput === 'object' ? JSON.stringify(parsedOutput) : targetRun.OutputData
                });
            } catch (e) {
                console.error("Failed to populate YT_Research sheet:", e);
            }
        } else if (agentKey === AGENT_KEYS.ANGLE) {
            await ytDb.updateProject(req.params.id, { CurrentStage: 'Waiting for Sir - Angle' });
        } else if (agentKey === AGENT_KEYS.STRATEGIST) {
            await ytDb.updateProject(req.params.id, { CurrentStage: 'Structure Review', Progress: '3' });
        } else if (agentKey === AGENT_KEYS.STRUCTURE) {
            // Not approved here
        } else if (agentKey === AGENT_KEYS.SCRIPT) {
            // Not approved here
        } else if (agentKey === AGENT_KEYS.CREATIVE_DIRECTOR) {
            await ytDb.updateProject(req.params.id, { CurrentStage: 'Thumbnail Strategy', Progress: '6', CurrentAgent: 7 });
            await ytDb.upsertAgentArtifact({
                sheetName: 'YT_CreativePlan',
                projectId: req.params.id,
                agentId: 6,
                version: targetRun.Version,
                status: 'Approved'
            });
        } else if (agentKey === AGENT_KEYS.THUMBNAIL_STRATEGIST) {
            await ytDb.updateProject(req.params.id, { CurrentStage: 'Thumbnail Design', Progress: '7', CurrentAgent: 8 });

            let finalOutput = targetRun.OutputData;
            if (req.body.selectedAngleId) { // Contains selected Concept ID
                try {
                    let parsedOutput = typeof finalOutput === 'string' ? JSON.parse(finalOutput) : finalOutput;
                    parsedOutput.selectedConceptId = req.body.selectedAngleId;
                    finalOutput = parsedOutput;
                } catch (e) { }
            }

            await ytDb.upsertAgentArtifact({
                sheetName: 'YT_ThumbnailConcepts',
                projectId: req.params.id,
                agentId: 7,
                version: targetRun.Version,
                outputJson: finalOutput,
                status: 'Approved'
            });
        } else if (agentKey === AGENT_KEYS.THUMBNAIL_DESIGNER) {
            await ytDb.updateProject(req.params.id, { CurrentStage: 'Title Strategy', Progress: '8', CurrentAgent: 9 });
            await ytDb.upsertAgentArtifact({
                sheetName: 'YT_ThumbnailDesign',
                projectId: req.params.id,
                agentId: 8,
                version: targetRun.Version,
                status: 'Approved'
            });
        } else if (agentKey === AGENT_KEYS.TITLE_STRATEGIST) {
            await ytDb.updateProject(req.params.id, { CurrentStage: 'SEO Initialization', Progress: '9', CurrentAgent: 10 });

            let finalOutput = targetRun.OutputData;
            if (req.body.selectedAngleId) {
                try {
                    let parsedOutput = typeof finalOutput === 'string' ? JSON.parse(finalOutput) : finalOutput;
                    parsedOutput.selectedTitleId = req.body.selectedAngleId;
                    finalOutput = parsedOutput;
                } catch (e) { }
            }

            await ytDb.upsertAgentArtifact({
                sheetName: 'YT_TitleOptions',
                projectId: req.params.id,
                agentId: 9,
                version: targetRun.Version,
                outputJson: finalOutput,
                status: 'Approved'
            });
        } else if (agentKey === AGENT_KEYS.SEO) {
            await ytDb.updateProject(req.params.id, { CurrentStage: 'Editor Preparation', Progress: '10', CurrentAgent: 11 });
            await ytDb.upsertAgentArtifact({
                sheetName: 'YT_SEOPackage',
                projectId: req.params.id,
                agentId: 10,
                version: targetRun.Version,
                status: 'Approved'
            });
        } else if (agentKey === AGENT_KEYS.EDITOR) {
            await ytDb.updateProject(req.params.id, { CurrentStage: 'Retention Review Preparation', Progress: '11', CurrentAgent: 12 });
            await ytDb.upsertAgentArtifact({
                sheetName: 'YT_EditPlan',
                projectId: req.params.id,
                agentId: 11,
                version: targetRun.Version,
                status: 'Approved'
            });
        } else if (agentKey === AGENT_KEYS.RETENTION) {
            await ytDb.updateProject(req.params.id, { CurrentStage: 'Brand Review Preparation', Progress: '12', CurrentAgent: 13 });
            await ytDb.upsertAgentArtifact({ sheetName: 'YT_RetentionReview', projectId: req.params.id, agentId: 12, version: targetRun.Version, status: 'Approved' });
        } else if (agentKey === AGENT_KEYS.BRAND) {
            await ytDb.updateProject(req.params.id, { CurrentStage: 'Final QC Preparation', Progress: '13', CurrentAgent: 14 });
            await ytDb.upsertAgentArtifact({ sheetName: 'YT_BrandReview', projectId: req.params.id, agentId: 13, version: targetRun.Version, status: 'Approved' });
        } else if (agentKey === AGENT_KEYS.QC) {
            await ytDb.updateProject(req.params.id, { CurrentStage: 'Analytics Pipeline', Progress: '14', CurrentAgent: 15 });
            await ytDb.upsertAgentArtifact({ sheetName: 'YT_QCReview', projectId: req.params.id, agentId: 14, version: targetRun.Version, status: 'Approved' });
        } else if (agentKey === AGENT_KEYS.ANALYTICS) {
            await ytDb.updateProject(req.params.id, { CurrentStage: 'Project Completed', Progress: '15', CurrentAgent: 15 });
            await ytDb.upsertAgentArtifact({ sheetName: 'YT_Analytics', projectId: req.params.id, agentId: 15, version: targetRun.Version, status: 'Approved' });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Sir Submissions (Decoupled from Approval)
router.post('/projects/:id/agents/:agentKey/submit-sir', async (req, res) => {
    try {
        const { agentKey } = req.params;
        const { runId, selectedAngleId } = req.body;

        await ytDb.submitAgentRunToSir(req.params.id, runId, selectedAngleId);

        let targetStage = null;
        if (agentKey === AGENT_KEYS.ANGLE) targetStage = 'Waiting for Sir - Angle';
        else if (agentKey === AGENT_KEYS.STRUCTURE) targetStage = 'Waiting for Sir - Structure';
        else if (agentKey === AGENT_KEYS.SCRIPT) targetStage = 'Waiting for Sir - Script';
        else if (agentKey === AGENT_KEYS.SEO) targetStage = 'Waiting for Sir - SEO';
        else if (agentKey === AGENT_KEYS.RETENTION) targetStage = 'Waiting for Sir - Retention';
        else if (agentKey === AGENT_KEYS.BRAND) targetStage = 'Waiting for Sir - Brand';
        else if (agentKey === AGENT_KEYS.QC) targetStage = 'Waiting for Sir - QC';
        else if (agentKey === AGENT_KEYS.ANALYTICS) targetStage = 'Waiting for Sir - Analytics';

        if (targetStage) {
            await ytDb.updateProject(req.params.id, { CurrentStage: targetStage });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Post Feedback to AI
router.post('/projects/:id/agents/:agentKey/feedback', async (req, res) => {
    try {
        const payload = {
            ProjectID: req.params.id,
            Stage: req.params.agentKey,
            AgentKey: req.params.agentKey,
            Version: req.body.version,
            FeedbackType: 'AI_Revision',
            FeedbackText: req.body.feedback,
            Source: 'User',
            IsSirFeedback: false
        };
        const fb = await ytDb.saveFeedback(payload);
        await ytDb.updateAgentRunFeedback(req.params.id, req.params.agentKey, req.body.version, req.body.feedback);
        res.json(fb);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Sir Review Actions
router.post('/projects/:id/sir-review', async (req, res) => {
    try {
        const { stage, feedbackText, isApproved, selectedAngleData } = req.body;

        // Save Sir Feedback
        if (feedbackText) {
            await ytDb.saveFeedback({
                ProjectID: req.params.id,
                Stage: stage,
                AgentKey: stage, // e.g. content_angle
                Version: req.body.version || 1,
                FeedbackType: stage,
                FeedbackText: feedbackText,
                Source: 'Sir',
                IsSirFeedback: true
            });
            const dbAgentKey = { 'Angle': 'content_angle', 'Structure': 'structure', 'Script': 'script' }[stage] || stage;
            await ytDb.updateAgentRunFeedback(req.params.id, dbAgentKey, req.body.version || 1, feedbackText);
            await ytDb.updateProject(req.params.id, { CurrentStage: `Feedback Received - ${stage}` });
        }

        // If Sir Approves
        if (isApproved === true) {
            // Physically mark the run as Approved Native
            const runs = await ytDb.getAgentRuns(req.params.id);
            const agentKeyMap = { 'Angle': 'content_angle', 'Structure': 'structure', 'Script': 'script' };
            const dbAgentKey = agentKeyMap[stage] || stage;
            const targetRun = runs.filter(r => r.ProjectID === req.params.id && r.AgentKey === dbAgentKey).pop();

            if (targetRun) {
                await ytDb.approveAgentRun(req.params.id, targetRun.RunID, selectedAngleData ? selectedAngleData.id : null);
            }

            if (stage === 'Angle' || stage === 'content_angle') {
                await ytDb.updateProject(req.params.id, {
                    Status: 'YouTube Strategy',
                    CurrentStage: 'YouTube Strategy',
                    CurrentAgent: '3',
                    Progress: '2'
                });
                if (selectedAngleData) {
                    await ytDb.updateTopicRegistryAngle(req.params.id, JSON.stringify(selectedAngleData));
                }
            } else if (stage === 'Structure' || stage === 'structure') {
                await ytDb.updateProject(req.params.id, { CurrentStage: 'Script Writing', CurrentAgent: '5', Progress: '4' });
            } else if (stage === 'Script' || stage === 'script') {
                await ytDb.updateProject(req.params.id, { CurrentStage: 'Script Approved', Progress: '5' });
            } else if (stage === 'SEO' || stage === 'seo') {
                await ytDb.updateProject(req.params.id, { CurrentStage: 'SEO Approved', CurrentAgent: '11', Progress: '10' });
            } else if (stage === 'retention' || stage === 'Retention') {
                await ytDb.updateProject(req.params.id, { CurrentStage: 'Retention Approved', CurrentAgent: '13', Progress: '12' });
            } else if (stage === 'brand' || stage === 'Brand') {
                await ytDb.updateProject(req.params.id, { CurrentStage: 'Brand Approved', CurrentAgent: '14', Progress: '13' });
            } else if (stage === 'qc' || stage === 'QC') {
                await ytDb.updateProject(req.params.id, { CurrentStage: 'QC Approved', CurrentAgent: '15', Progress: '14' });
            } else if (stage === 'analytics' || stage === 'Analytics') {
                await ytDb.updateProject(req.params.id, { CurrentStage: 'Analytics Approved', Progress: '15' });
            }
        } else if (isApproved === false && !feedbackText) {
            // Just transition to waiting
            await ytDb.updateProject(req.params.id, { CurrentStage: `Waiting for Sir - ${stage}` });
        }

        if (isApproved === false) {
            await ytDb.unapproveAgentRun(req.params.id, stage);
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
