const express = require('express');
const router = express.Router();
const { runAgentStep, VALID_AGENT_KEYS } = require('../adsscript/adsScriptAgentRunner');
const logger = require('../logger');

// POST /api/ads/projects/:id/agents/:key/run
router.post('/projects/:id/agents/:key/run', async (req, res) => {
    try {
        const { key } = req.params;
        if (!VALID_AGENT_KEYS.includes(key)) {
            return res.status(404).json({ error: 'Unknown agent key', availableAgents: VALID_AGENT_KEYS });
        }

        const result = await runAgentStep({
            projectId: req.params.id,
            agentKey: key,
            inputData: req.body || {}
        });

        res.json(result);
    } catch (err) {
        logger.error({ err }, `Ads Script agent run failed (project ${req.params.id}, agent ${req.params.key})`);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
