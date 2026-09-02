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

    // Deep Logic / Structuring Agents -> DEEPSEEK
    "3": { provider: "deepseek", model: "deepseek-chat" },
    "4": { provider: "deepseek", model: "deepseek-chat" },
    "12": { provider: "deepseek", model: "deepseek-chat" },
    "13": { provider: "deepseek", model: "deepseek-chat" },

    // Ultra Fast / Lightweight Creative Agents -> GROQ NATIVE
    "6": { provider: "groq", model: "qwen/qwen3.8-27b" },
    "7": { provider: "groq", model: "qwen/qwen3.8-27b" },
    "8": { provider: "groq", model: "qwen/qwen3.8-27b" },
    "9": { provider: "groq", model: "qwen/qwen3.8-27b" },
    "10.5": { provider: "groq", model: "qwen/qwen3.8-27b" }
};
