const aiModels = require('./aiModels');

module.exports = {
    "1": { provider: "gemini", model: aiModels.gemini.heavy },
    "2": { provider: "gemini", model: aiModels.gemini.heavy },
    "3": { provider: "openrouter", model: "openrouter/free" },
    "4": { provider: "openrouter", model: "openrouter/free" },
    "5": { provider: "gemini", model: aiModels.gemini.heavy },
    "6": { provider: "gemini", model: aiModels.gemini.default },
    "7": { provider: "openrouter", model: "openrouter/free" },
    "8": { provider: "openrouter", model: "openrouter/free" },
    "9": { provider: "gemini", model: aiModels.gemini.default },
    "10": { provider: "openrouter", model: "openrouter/free" },
    "10.5": { provider: "gemini", model: aiModels.gemini.default },
    "11": { provider: "openrouter", model: "openrouter/free" },
    "12": { provider: "gemini", model: aiModels.gemini.default },
    "13": { provider: "openrouter", model: "openrouter/free" },
    "14": { provider: "gemini", model: aiModels.gemini.heavy },
    "15": { provider: "gemini", model: aiModels.gemini.default }
};
