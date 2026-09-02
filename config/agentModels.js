const aiModels = require('./aiModels');

module.exports = {
    // Huge Context Agents (Transcripts, Full Scripts) -> GEMINI
    "1": { provider: "gemini", model: aiModels.gemini.fast },
    "2": { provider: "gemini", model: aiModels.gemini.fast },
    "5": { provider: "gemini", model: aiModels.gemini.fast },
    "10": { provider: "gemini", model: aiModels.gemini.fast },
    "11": { provider: "gemini", model: aiModels.gemini.fast },
    "14": { provider: "gemini", model: aiModels.gemini.fast },
    "15": { provider: "gemini", model: aiModels.gemini.fast },

    // Deep Logic / Structuring Agents -> OPENROUTER (100% Free Model)
    "3": { provider: "openrouter", model: aiModels.openRouter.free },
    "4": { provider: "openrouter", model: aiModels.openRouter.free },
    "12": { provider: "openrouter", model: aiModels.openRouter.free },
    "13": { provider: "openrouter", model: aiModels.openRouter.free },

    // Ultra Fast / Lightweight Creative Agents -> GROQ NATIVE
    "6": { provider: "groq", model: "qwen/qwen3.8-27b" },
    "7": { provider: "groq", model: "qwen/qwen3.8-27b" },
    "8": { provider: "groq", model: "qwen/qwen3.8-27b" },
    "9": { provider: "groq", model: "qwen/qwen3.8-27b" },
    "10.5": { provider: "groq", model: "qwen/qwen3.8-27b" }
};
