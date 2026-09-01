const aiModels = require('./aiModels');

module.exports = {
    "1": { provider: "openrouter", model: "groq/llama-3.1-70b-versatile" },
    "2": { provider: "openrouter", model: "groq/llama-3.1-70b-versatile" },
    "3": { provider: "openrouter", model: "openrouter/free" },
    "4": { provider: "openrouter", model: "openrouter/free" },
    "5": { provider: "openrouter", model: "groq/llama-3.1-70b-versatile" },
    "6": { provider: "gemini", model: aiModels.gemini.fast },
    "7": { provider: "openrouter", model: "openrouter/free" },
    "8": { provider: "openrouter", model: "openrouter/free" },
    "9": { provider: "gemini", model: aiModels.gemini.fast },
    "10": { provider: "openrouter", model: "openrouter/free" },
    "10.5": { provider: "gemini", model: aiModels.gemini.fast },
    "11": { provider: "openrouter", model: "groq/llama-3.1-70b-versatile" },
    "12": { provider: "gemini", model: aiModels.gemini.fast },
    "13": { provider: "openrouter", model: "openrouter/free" },
    "14": { provider: "openrouter", model: "groq/llama-3.1-70b-versatile" },
    "15": { provider: "gemini", model: aiModels.gemini.default }
};
