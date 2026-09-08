const express = require('express');
const router = express.Router();
const adsDb = require('../adsscript/adsScriptDatabase');
const logger = require('../logger');

// Connect once at server startup and fail loudly (not silently) if unreachable/missing.
adsDb.getDb()
    .then(() => logger.info('Ads Script Writer Database connected.'))
    .catch(e => logger.error({ err: e }, 'Ads Script Writer DB failed to initialize. Check ADS_MONGODB_URI.'));

// GET /api/ads/projects
router.get('/projects', async (req, res) => {
    try {
        const projects = await adsDb.listProjects();
        res.json(projects);
    } catch (err) {
        logger.error({ err }, 'Failed to list Ads Script projects');
        res.status(500).json({ error: err.message });
    }
});

// GET /api/ads/projects/:id
router.get('/projects/:id', async (req, res) => {
    try {
        const project = await adsDb.getProject(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json(project);
    } catch (err) {
        logger.error({ err }, `Failed to fetch Ads Script project ${req.params.id}`);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/ads/projects
router.post('/projects', async (req, res) => {
    try {
        const { topic, audienceId } = req.body;
        if (!topic || !topic.trim()) return res.status(400).json({ error: 'topic is required' });

        const project = await adsDb.createProject({ topic: topic.trim(), audienceId });
        res.json(project);
    } catch (err) {
        logger.error({ err }, 'Failed to create Ads Script project');
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/ads/projects/:id
router.patch('/projects/:id', async (req, res) => {
    try {
        const project = await adsDb.updateProject(req.params.id, req.body);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json(project);
    } catch (err) {
        logger.error({ err }, `Failed to update Ads Script project ${req.params.id}`);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/ads/projects/:id
router.delete('/projects/:id', async (req, res) => {
    try {
        const success = await adsDb.deleteProject(req.params.id);
        if (!success) return res.status(404).json({ error: 'Project not found or unable to delete' });
        res.json({ success: true });
    } catch (err) {
        logger.error({ err }, `Failed to delete Ads Script project ${req.params.id}`);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
