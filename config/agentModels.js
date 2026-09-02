const aiModels = require('./aiModels');

module.exports = {
    // Huge Context Agents (Transcripts, Full Scripts) -> DEEPSEEK (Replaces Google 429 loops)
    "1": { provider: "deepseek", model: "deepseek-chat" },
    "2": { provider: "deepseek", model: "deepseek-chat" },
    "5": { provider: "deepseek", model: "deepseek-chat" },
    "10": { provider: "deepseek", model: "deepseek-chat" },
    "11": { provider: "deepseek", model: "deepseek-chat" },
    "14": { provider: "deepseek", model: "deepseek-chat" },
    "15": { provider: "deepseek", model: "deepseek-chat" },

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
