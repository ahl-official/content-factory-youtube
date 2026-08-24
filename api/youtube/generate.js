const { runAgentStep } = require('../../youtube/youtubeAgentRunner');

module.exports = async function (req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { projectId, currentAgent, payload } = req.body;

        if (!projectId || !currentAgent) {
            return res.status(400).json({ error: 'Missing projectId or currentAgent' });
        }

        // Run the agent synchronously in the Vercel function
        const result = await runAgentStep({
            projectId,
            agentId: currentAgent,
            inputData: payload || {}
        });

        if (!result.success) {
            return res.status(500).json({ status: 'failed', error: result.error });
        }

        return res.status(200).json({
            status: 'success',
            agentId: result.agentId,
            output: result.output,
            nextAgent: result.nextAgent,
            runRecord: result.runRecord
        });
    } catch (e) {
        return res.status(500).json({ status: 'failed', error: e.message });
    }
};

module.exports.config = {
    maxDuration: 60
};
