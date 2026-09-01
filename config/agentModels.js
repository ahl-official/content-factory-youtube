const aiModels = require('./aiModels');

module.exports = {
    "1": { provider: "gemini", model: aiModels.gemini.fast },
    "2": { provider: "gemini", model: aiModels.gemini.fast },
    "3": { provider: "openrouter", model: "openrouter/free" },
    "4": { provider: "openrouter", model: "openrouter/free" },
    "5": { provider: "openrouter", model: "meta-llama/llama-3-8b-instruct:free" },
    "6": { provider: "gemini", model: aiModels.gemini.fast },
    "7": { provider: "openrouter", model: "openrouter/free" },
    "8": { provider: "openrouter", model: "openrouter/free" },
    "9": { provider: "gemini", model: aiModels.gemini.fast },
    "10": { provider: "openrouter", model: "openrouter/free" },
    "10.5": { provider: "gemini", model: aiModels.gemini.fast },
    "11": { provider: "openrouter", model: "meta-llama/llama-3-8b-instruct:free" },
    "12": { provider: "gemini", model: aiModels.gemini.fast },
    "13": { provider: "openrouter", model: "openrouter/free" },
    "14": { provider: "gemini", model: aiModels.gemini.fast },
    "15": { provider: "gemini", model: aiModels.gemini.default }
};
