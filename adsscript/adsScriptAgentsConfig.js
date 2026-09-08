require('dotenv').config();

module.exports = {
    // Actual model/provider routing lives in config/agentModels.js (ads_angle, ads_script, ads_audit).
    // These constants mirror youtubeAgentsConfig.js's shape for consistency across engines.
    DEFAULT_MAX_TOKENS: 1500,
    SCRIPT_MAX_TOKENS: 3000,
    TEMPERATURE: 0.7,

    AGENT_KEYS: { 1: 'angle', 2: 'script', 3: 'audit' },
    AGENT_NAMES: { 1: 'Ad Angle Agent', 2: 'Script Writer Agent', 3: 'Audit Agent' }
};
