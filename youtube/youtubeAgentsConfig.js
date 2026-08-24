require('dotenv').config();

module.exports = {
    YT_AI_PROVIDER: process.env.YT_AI_PROVIDER || 'openrouter',
    YT_AI_MODEL: process.env.YT_AI_MODEL || 'openrouter/free',
    YT_ALLOW_PAID_FALLBACK: false,

    // Limits
    DEFAULT_MAX_TOKENS: 4000,
    SCRIPT_MAX_TOKENS: 10000,
    TEMPERATURE: 0.7
};
