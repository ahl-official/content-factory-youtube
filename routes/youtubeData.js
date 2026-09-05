const express = require('express');
const router = express.Router();
const ytDb = require('../youtube/youtubeDatabase');
const logger = require('../logger');
const { OAuth2Client } = require('google-auth-library');

// Auto-initialize YouTube DB on module load to guarantee sheets exist before requests happen
ytDb.initializeYoutubeSheets()
    .then(success => {
        if (success) {
            logger.info('YouTube Factory Database connected and tabs verified.');
        } else {
            logger.warn('YouTube Factory DB failed to initialize. Check YT_SHEET_ID and credentials.');
        }
    })
    .catch(e => logger.error({ err: e }, 'YouTube database initialization error.'));

// YouTube UI Memory State (Bifurcated from Reels)
router.get('/db/load', async (req, res) => {
    try {
        const settings = await ytDb.getSettings();
        const data = {};
        for (const [k, v] of Object.entries(settings)) {
            try { data[k] = JSON.parse(v); } catch (e) { data[k] = v; }
        }
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/db/save', async (req, res) => {
    try {
        const payload = req.body;
        for (let [key, val] of Object.entries(payload)) {
            const stringVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
            await ytDb.updateSetting(key, stringVal);
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/oauth/url', (req, res) => {
    try {
        const client = new OAuth2Client(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET,
            req.query.redirectUri
        );
        const url = client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/yt-analytics.readonly'],
            prompt: 'consent'
        });
        res.json({ url });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/oauth/exchange', async (req, res) => {
    try {
        const client = new OAuth2Client(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET,
            req.body.redirectUri
        );
        const { tokens } = await client.getToken(req.body.code);
        if (tokens.refresh_token) {
            await ytDb.updateSetting('YOUTUBE_REFRESH_TOKEN', tokens.refresh_token);
        }
        res.json({ success: true, hasRefresh: !!tokens.refresh_token });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Projects
router.get('/projects', async (req, res) => {
    try {
        const projects = await ytDb.listProjects();
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/projects/:id', async (req, res) => {
    try {
        const project = await ytDb.getProject(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/projects', async (req, res) => {
    try {
        const title = req.body.title || req.body.WorkingTitle;
        const project = await ytDb.createProject(req.body);

        await ytDb.registerTopic({
            ProjectID: project.ProjectID,
            OriginalTitle: title,
            CanonicalTopic: req.body.ResearchBehavior === 'suggest_topics' ? '' : title,
            Status: 'In Research'
        });
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch('/projects/:id', async (req, res) => {
    try {
        const project = await ytDb.updateProject(req.params.id, req.body);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Agent Runs
router.get('/projects/:id/agent-runs', async (req, res) => {
    try {
        const runs = await ytDb.getAgentRuns(req.params.id);
        res.json(runs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/projects/:id/agent-runs', async (req, res) => {
    try {
        const payload = { ...req.body, ProjectID: req.params.id };
        const run = await ytDb.createAgentRun(payload);
        res.json(run);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Feedback
router.get('/projects/:id/feedback', async (req, res) => {
    try {
        const feedback = await ytDb.getFeedback(req.params.id);
        res.json(feedback);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/projects/:id/feedback', async (req, res) => {
    try {
        const payload = { ...req.body, ProjectID: req.params.id };
        const fb = await ytDb.saveFeedback(payload);
        res.json(fb);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Scripts
router.get('/projects/:id/scripts', async (req, res) => {
    try {
        const scripts = await ytDb.getScriptVersions(req.params.id);
        res.json(scripts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/projects/:id/scripts', async (req, res) => {
    try {
        const payload = { ...req.body, ProjectID: req.params.id };
        const script = await ytDb.saveScriptVersion(payload);
        res.json(script);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Research
router.get('/projects/:id/research', async (req, res) => {
    try {
        const research = await ytDb.getResearch(req.params.id);
        res.json(research);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/projects/:id/research', async (req, res) => {
    try {
        const payload = { ...req.body, ProjectID: req.params.id };
        const resObj = await ytDb.saveResearch(payload);
        res.json(resObj);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Assets
router.get('/projects/:id/assets', async (req, res) => {
    try {
        const assets = await ytDb.getAssets(req.params.id);
        res.json(assets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/projects/:id/assets', async (req, res) => {
    try {
        const payload = { ...req.body, ProjectID: req.params.id };
        const asset = await ytDb.saveAsset(payload);
        res.json(asset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Topics Check
router.post('/topics/check-duplicate', async (req, res) => {
    try {
        const result = await ytDb.checkExactDuplicateTopic(req.body.title);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/projects/:id/topics/select', async (req, res) => {
    try {
        const { topicIdea } = req.body;
        // Update registry
        await ytDb.updateTopicRegistryTopic(req.params.id, topicIdea);
        // We might also update the WorkingTitle if it's currently missing/broad
        await ytDb.updateProject(req.params.id, {
            WorkingTitle: topicIdea,
            ResearchBehavior: 'research_topic', // transition out of discovery
            Status: 'Researching Topic'
        });
        res.json({ success: true, topicIdea });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// AI Memory & Learning
router.get('/learning', async (req, res) => {
    try {
        const aiModels = require('../config/aiModels');
        const memory = await getMemory();

        // Attach system health statically for the AI Configuration panel
        memory.aiConfig = {
            provider: 'Gemini (Auto-Routed)',
            model: aiModels.gemini.default,
            fallbackStatus: 'OpenRouter Free',
            connectionStatus: 'Connected'
        };

        res.json(memory);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helper func for saving memory
const saveMemory = async (mem) => {
    try {
        if (mem.learnedPreferences) await ytDb.updateSetting('learnedPreferences', JSON.stringify(mem.learnedPreferences));
        if (mem.learnedStyle) await ytDb.updateSetting('learnedStyle', JSON.stringify(mem.learnedStyle));
        if (mem.history) await ytDb.updateSetting('history', JSON.stringify(mem.history));
        if (mem.agentPerformance) await ytDb.updateSetting('agentPerformance', JSON.stringify(mem.agentPerformance));
        if (mem.approvalHistory) await ytDb.updateSetting('approvalHistory', JSON.stringify(mem.approvalHistory));
        if (mem.rejectedIdeas) await ytDb.updateSetting('rejectedIdeas', JSON.stringify(mem.rejectedIdeas));
    } catch (e) {
        logger.error({ err: e }, "Failed to save AI Memory to Google Sheets.");
    }
};

const getMemory = async () => {
    let memory = { learnedStyle: {}, learnedPreferences: [], history: [], agentPerformance: {}, approvalHistory: [], rejectedIdeas: [] };
    try {
        const settings = await ytDb.getSettings();
        if (settings['learnedPreferences']) memory.learnedPreferences = settings['learnedPreferences'];
        if (settings['learnedStyle']) memory.learnedStyle = settings['learnedStyle'];
        if (settings['history']) memory.history = settings['history'];
        if (settings['agentPerformance']) memory.agentPerformance = settings['agentPerformance'];
        if (settings['approvalHistory']) memory.approvalHistory = settings['approvalHistory'];
        if (settings['rejectedIdeas']) memory.rejectedIdeas = settings['rejectedIdeas'];
    } catch (e) {
        logger.warn("Could not load AI Memory from Google Sheets.");
    }
    return memory;
};

const updateAgentScore = (mem, agentName, type) => {
    if (!mem.agentPerformance) mem.agentPerformance = {};
    if (!mem.agentPerformance[agentName]) {
        mem.agentPerformance[agentName] = { approvedCount: 0, rejectedCount: 0, revisionCount: 0, performanceScore: 100 };
    }

    const stats = mem.agentPerformance[agentName];
    if (type === 'approve') stats.approvedCount++;
    if (type === 'reject') stats.rejectedCount++;
    if (type === 'revision') stats.revisionCount++;

    const total = stats.approvedCount + stats.rejectedCount;
    stats.performanceScore = total > 0 ? Math.round((stats.approvedCount / total) * 100) : 100;
};

router.post('/learning/feedback', async (req, res) => {
    try {
        const { feedback, agentName, projectId, extractedRule, category, appliesTo } = req.body;
        const mem = await getMemory();

        mem.learnedPreferences.unshift({
            id: Date.now().toString(),
            rule: extractedRule,
            category: category,
            appliesTo: appliesTo || [agentName?.toLowerCase() || 'general']
        });

        mem.history.unshift({
            id: 'h' + Date.now(),
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            source: `Sir Review (${agentName})`,
            learned: extractedRule
        });

        if (agentName) updateAgentScore(mem, agentName, 'revision');

        await saveMemory(mem);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/learning/approval', async (req, res) => {
    try {
        const { projectId, agentName, output, approvalReason } = req.body;
        const mem = await getMemory();

        if (!mem.approvalHistory) mem.approvalHistory = [];
        mem.approvalHistory.unshift({
            projectId,
            agent: agentName,
            output: output?.substring(0, 300) + (output?.length > 300 ? '...' : ''),
            approvalReason: approvalReason || "Standard approval",
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        });

        if (agentName) updateAgentScore(mem, agentName, 'approve');

        await saveMemory(mem);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/learning/rejection', async (req, res) => {
    try {
        const { projectId, agentName, rejectedOutput, rejectionReason, learnedAvoidRule } = req.body;
        const mem = await getMemory();

        if (!mem.rejectedIdeas) mem.rejectedIdeas = [];
        mem.rejectedIdeas.unshift({
            projectId,
            agent: agentName,
            rejectedOutput: rejectedOutput?.substring(0, 300) + (rejectedOutput?.length > 300 ? '...' : ''),
            rejectionReason,
            learnedAvoidRule
        });

        // Store a generalized negative learned preference too
        if (learnedAvoidRule) {
            mem.learnedPreferences.unshift({
                id: Date.now().toString(),
                rule: learnedAvoidRule,
                category: 'Rejection Output',
                appliesTo: [agentName?.toLowerCase()]
            });
        }

        if (agentName) updateAgentScore(mem, agentName, 'reject');

        await saveMemory(mem);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/learning/voice', async (req, res) => {
    try {
        const { extractedRule, category, appliesTo } = req.body;
        const mem = await getMemory();

        if (extractedRule) {
            mem.learnedPreferences.unshift({
                id: Date.now().toString(),
                rule: extractedRule,
                category: category || 'General Voice Note',
                appliesTo: appliesTo || ['all']
            });

            mem.history.unshift({
                id: 'h' + Date.now(),
                date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                source: `Sir Voice Note`,
                learned: extractedRule
            });
        }

        await saveMemory(mem);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
