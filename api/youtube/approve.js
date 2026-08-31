const ytDb = require('../../youtube/youtubeDatabase');

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

const AGENT_KEY_TO_ID = {
    'research': 1, 'content_angle': 2, 'strategist': 3, 'structure': 4, 'script': 5,
    'creative_director': 6, 'thumbnail_strategist': 7, 'thumbnail_designer': 8,
    'title_strategist': 9, 'seo': 10, 'metadata': 10.5, 'editor': 11, 'retention': 12,
    'brand': 13, 'qc': 14, 'analytics': 15
};

module.exports = async function (req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { runId, selectedAngleId } = req.body;
        if (!runId) return res.status(400).json({ error: 'Missing runId' });

        // Retrieve run to find ProjectID and AgentKey
        // Note: For a robust implementation, we fetch all runs, or pass ProjectID in req.body.
        // Assuming we pass projectId or we find it
        // Actually runId is globally unique in our pseudo-db. Let's ask ytDb to fetch all runs. 
        // We really need ProjectId. The frontend might need to pass projectId. Let's check `YoutubeFactory.jsx` line 1205:
        // `body: JSON.stringify({ runId: latestRun.RunID, selectedAngleId })`
        // It does not pass projectId! I will modify YoutubeFactory.jsx to pass projectId, OR search through all projects. 
        // We will just patch YoutubeFactory.jsx to send projectId and agentKey.
        const projectId = req.body.projectId;
        const agentKey = req.body.agentKey;

        if (!projectId || !agentKey) return res.status(400).json({ error: 'Missing projectId or agentKey' });

        const runs = await ytDb.getAgentRuns(projectId);
        const targetRun = runs.find(r => r.RunID === runId);
        if (!targetRun) throw new Error('Run not found');

        // Approve natively
        if ([AGENT_KEYS.RESEARCH, AGENT_KEYS.STRATEGIST, AGENT_KEYS.CREATIVE_DIRECTOR, AGENT_KEYS.THUMBNAIL_STRATEGIST, AGENT_KEYS.THUMBNAIL_DESIGNER, AGENT_KEYS.TITLE_STRATEGIST, AGENT_KEYS.SEO, AGENT_KEYS.METADATA, AGENT_KEYS.EDITOR, AGENT_KEYS.RETENTION, AGENT_KEYS.BRAND, AGENT_KEYS.QC, AGENT_KEYS.ANALYTICS].includes(agentKey)) {
            await ytDb.approveAgentRun(projectId, runId, selectedAngleId);
        }

        // Apply artifact logic manually
        if (agentKey === AGENT_KEYS.RESEARCH) {
            await ytDb.updateProject(projectId, { CurrentStage: 'Content Angle', CurrentAgent: '2', Progress: '1' });
            try {
                let parsedOutput = targetRun.OutputData;
                try { parsedOutput = JSON.parse(targetRun.OutputData); } catch (e) { }

                await ytDb.saveResearch({
                    ProjectID: projectId,
                    Topic: parsedOutput?.topicSummary || 'Approved Research Compilation',
                    SourceType: 'Agent Generation',
                    SourceTitle: 'Research Agent output',
                    Insight: typeof parsedOutput === 'object' ? JSON.stringify(parsedOutput) : targetRun.OutputData
                });
            } catch (e) { }
        } else if (agentKey === AGENT_KEYS.ANGLE) {
            await ytDb.updateProject(projectId, { CurrentStage: 'Waiting for Sir Checkpoint / Strategist Prep', CurrentAgent: 3, Progress: '2' });
            if (selectedAngleId) {
                try {
                    let parsedOutput = typeof targetRun.OutputData === 'string' ? JSON.parse(targetRun.OutputData) : targetRun.OutputData;
                    const selectedAngle = parsedOutput.angles?.find(a => a.id === selectedAngleId);
                    if (selectedAngle) {
                        await ytDb.updateTopicRegistryAngle(projectId, JSON.stringify(selectedAngle));
                    }
                } catch (e) { }
            }
        } else if (agentKey === AGENT_KEYS.STRATEGIST) {
            await ytDb.updateProject(projectId, { CurrentStage: 'Structure Architect', CurrentAgent: 4, Progress: '3' });
        } else if (agentKey === AGENT_KEYS.STRUCTURE) {
            await ytDb.updateProject(projectId, { CurrentStage: 'Script Writing', CurrentAgent: 5, Progress: '4' });
        } else if (agentKey === AGENT_KEYS.SCRIPT) {
            await ytDb.updateProject(projectId, { CurrentStage: 'Creative Director', CurrentAgent: 6, Progress: '5' });
            await ytDb.approveScriptVersion(projectId, targetRun.RunID);
        } else if (agentKey === AGENT_KEYS.CREATIVE_DIRECTOR) {
            await ytDb.updateProject(projectId, { CurrentStage: 'Thumbnail Strategy', Progress: '6', CurrentAgent: 7 });
            await ytDb.upsertAgentArtifact({ sheetName: 'YT_CreativePlan', projectId: projectId, agentId: 6, version: targetRun.Version, status: 'Approved' });
        } else if (agentKey === AGENT_KEYS.THUMBNAIL_STRATEGIST) {
            await ytDb.updateProject(projectId, { CurrentStage: 'Thumbnail Design', Progress: '7', CurrentAgent: 8 });
            let finalOutput = targetRun.OutputData;
            if (selectedAngleId) {
                try {
                    let parsedOutput = typeof finalOutput === 'string' ? JSON.parse(finalOutput) : finalOutput;
                    parsedOutput.selectedConceptId = selectedAngleId;
                    finalOutput = parsedOutput;
                } catch (e) { }
            }
            await ytDb.upsertAgentArtifact({ sheetName: 'YT_ThumbnailConcepts', projectId: projectId, agentId: 7, version: targetRun.Version, outputJson: finalOutput, status: 'Approved' });
        } else if (agentKey === AGENT_KEYS.THUMBNAIL_DESIGNER) {
            await ytDb.updateProject(projectId, { CurrentStage: 'Title Strategy', Progress: '8', CurrentAgent: 9 });
            await ytDb.upsertAgentArtifact({ sheetName: 'YT_ThumbnailDesign', projectId: projectId, agentId: 8, version: targetRun.Version, status: 'Approved' });
        } else if (agentKey === AGENT_KEYS.TITLE_STRATEGIST) {
            await ytDb.updateProject(projectId, { CurrentStage: 'SEO Initialization', Progress: '9', CurrentAgent: 10 });
            let finalOutput = targetRun.OutputData;
            if (selectedAngleId) {
                try {
                    let parsedOutput = typeof finalOutput === 'string' ? JSON.parse(finalOutput) : finalOutput;
                    parsedOutput.selectedTitleId = selectedAngleId;
                    finalOutput = parsedOutput;
                } catch (e) { }
            }
            await ytDb.upsertAgentArtifact({ sheetName: 'YT_TitleOptions', projectId: projectId, agentId: 9, version: targetRun.Version, outputJson: finalOutput, status: 'Approved' });
        } else if (agentKey === AGENT_KEYS.SEO) {
            await ytDb.updateProject(projectId, { CurrentStage: 'Metadata Generation', Progress: '10', CurrentAgent: 10.5 });
            await ytDb.upsertAgentArtifact({ sheetName: 'YT_SEOPackage', projectId: projectId, agentId: 10, version: targetRun.Version, status: 'Approved' });
        } else if (agentKey === AGENT_KEYS.METADATA) {
            await ytDb.updateProject(projectId, { CurrentStage: 'Editor Preparation', Progress: '10.5', CurrentAgent: 11 });
            await ytDb.upsertAgentArtifact({ sheetName: 'YT_Metadata', projectId: projectId, agentId: 10.5, version: targetRun.Version, status: 'Approved' });
        } else if (agentKey === AGENT_KEYS.EDITOR) {
            await ytDb.updateProject(projectId, { CurrentStage: 'Retention Review Preparation', Progress: '11', CurrentAgent: 12 });
            await ytDb.upsertAgentArtifact({ sheetName: 'YT_EditPlan', projectId: projectId, agentId: 11, version: targetRun.Version, status: 'Approved' });
        } else if (agentKey === AGENT_KEYS.RETENTION) {
            await ytDb.updateProject(projectId, { CurrentStage: 'Brand Review Preparation', Progress: '12', CurrentAgent: 13 });
            await ytDb.upsertAgentArtifact({ sheetName: 'YT_RetentionReview', projectId: projectId, agentId: 12, version: targetRun.Version, status: 'Approved' });
        } else if (agentKey === AGENT_KEYS.BRAND) {
            await ytDb.updateProject(projectId, { CurrentStage: 'Final QC Preparation', Progress: '13', CurrentAgent: 14 });
            await ytDb.upsertAgentArtifact({ sheetName: 'YT_BrandReview', projectId: projectId, agentId: 13, version: targetRun.Version, status: 'Approved' });
        } else if (agentKey === AGENT_KEYS.QC) {
            await ytDb.updateProject(projectId, { CurrentStage: 'Analytics Pipeline', Progress: '14', CurrentAgent: 15 });
            await ytDb.upsertAgentArtifact({ sheetName: 'YT_QCReview', projectId: projectId, agentId: 14, version: targetRun.Version, status: 'Approved' });
        } else if (agentKey === AGENT_KEYS.ANALYTICS) {
            await ytDb.updateProject(projectId, { CurrentStage: 'Project Completed', Progress: '15', CurrentAgent: 15 });
            await ytDb.upsertAgentArtifact({ sheetName: 'YT_Analytics', projectId: projectId, agentId: 15, version: targetRun.Version, status: 'Approved' });
        }

        return res.status(200).json({ status: 'success', message: 'Approved and artifacts persisted successfully.' });
    } catch (e) {
        return res.status(500).json({ status: 'failed', error: e.message });
    }
};
