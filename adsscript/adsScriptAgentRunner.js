const adsDb = require('./adsScriptDatabase');
const { runAdAngleAgent } = require('./agents/adAngleAgent');
const { runScriptWriterAgent } = require('./agents/scriptWriterAgent');
const { runAuditAgent } = require('./agents/auditAgent');

const VALID_AGENT_KEYS = ['angle', 'script', 'audit'];

function findAngle(project, angleId) {
    return (project.angleOptions || []).find(a => a.id === angleId);
}

async function runAgentStep({ projectId, agentKey, inputData = {} }) {
    if (!VALID_AGENT_KEYS.includes(agentKey)) {
        throw new Error(`Unknown Ads Script agent key: ${agentKey}`);
    }

    const project = await adsDb.getProject(projectId);
    if (!project) throw new Error('Project not found');

    const audience = inputData.audience || null;

    switch (agentKey) {
        case 'angle': {
            const output = await runAdAngleAgent(project, audience, inputData.previousOutput || null, inputData.feedback || null);
            const updated = await adsDb.updateProject(projectId, {
                angleOptions: output.angleOptions,
                status: 'angles_generated'
            });
            return { success: true, agentKey, output, project: updated };
        }
        case 'script': {
            const angle = inputData.angle || findAngle(project, inputData.angleId);
            if (!angle) throw new Error('Selected angle is required to write a script');
            const output = await runScriptWriterAgent(project, audience, angle, inputData.feedback || null);
            return { success: true, agentKey, output, angleUsed: angle };
        }
        case 'audit': {
            const angle = inputData.angle || findAngle(project, inputData.angleId);
            if (!angle) throw new Error('Selected angle is required to audit a script');
            if (!inputData.draftScript) throw new Error('draftScript is required for the audit stage');

            const output = await runAuditAgent(project, audience, angle, inputData.draftScript, inputData.feedback || null);

            const versionRecord = {
                version: (project.scriptVersions?.length || 0) + 1,
                angleUsed: angle,
                script: output.finalScript,
                auditNotes: output.auditNotes,
                createdAt: new Date().toISOString()
            };
            const updated = await adsDb.addScriptVersion(projectId, versionRecord);
            return { success: true, agentKey, output, versionRecord, project: updated };
        }
        default:
            throw new Error(`Unhandled Ads Script agent key: ${agentKey}`);
    }
}

module.exports = { runAgentStep, VALID_AGENT_KEYS };
