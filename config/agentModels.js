const aiModels = require('./aiModels');

module.exports = {
    // Huge Context Agents (Transcripts, Full Scripts) -> GROQ (Safeguarded by new token limits)
    "1": { provider: "groq", model: "qwen/qwen3.8-27b" },
    "2": { provider: "groq", model: "qwen/qwen3.8-27b" },
    "5": { provider: "groq", model: "qwen/qwen3.8-27b" },
    "10": { provider: "groq", model: "qwen/qwen3.8-27b" },
    "11": { provider: "groq", model: "qwen/qwen3.8-27b" },
    "14": { provider: "groq", model: "qwen/qwen3.8-27b" },
    "15": { provider: "groq", model: "qwen/qwen3.8-27b" },

    // Deep Logic / Structuring Agents -> GROQ
    "3": { provider: "groq", model: "qwen/qwen3.8-27b" },
    "4": { provider: "groq", model: "qwen/qwen3.8-27b" },
    "12": { provider: "groq", model: "qwen/qwen3.8-27b" },
    "13": { provider: "groq", model: "qwen/qwen3.8-27b" },

    // Ultra Fast / Lightweight Creative Agents -> GROQ NATIVE
    "6": { provider: "groq", model: "qwen/qwen3.8-27b" },
    "7": { provider: "groq", model: "qwen/qwen3.8-27b" },
    "8": { provider: "groq", model: "qwen/qwen3.8-27b" },
    "9": { provider: "groq", model: "qwen/qwen3.8-27b" },
    "10.5": { provider: "groq", model: "qwen/qwen3.8-27b" }
};
