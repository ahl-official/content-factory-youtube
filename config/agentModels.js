const aiModels = require('./aiModels');

module.exports = {
    // 🧠 MASSIVE CONTEXT AGENTS: Keep on Gemini (Free 1-Million Tokens)
    "1": { provider: "gemini", model: aiModels.gemini.fast }, // Research
    "2": { provider: "gemini", model: aiModels.gemini.fast }, // Angles
    "5": { provider: "gemini", model: aiModels.gemini.fast }, // Script Writer

    // 🎓 LATE-STAGE PRODUCTION / QC: Moved to OpenRouter logic
    "10": { provider: "openrouter", model: aiModels.openRouter.smartLogic }, // SEO
    "11": { provider: "openrouter", model: aiModels.openRouter.smartLogic }, // Editor 
    "14": { provider: "openrouter", model: aiModels.openRouter.smartLogic }, // QC

    // ♟️ DEEP STRATEGY AGENTS: OpenRouter (GPT-4o-Mini - Highly smart, $0.15/1M Tokens)
    "3": { provider: "openrouter", model: aiModels.openRouter.smartLogic }, // Strategist
    "4": { provider: "openrouter", model: aiModels.openRouter.smartLogic }, // Structure Architect
    "12": { provider: "openrouter", model: aiModels.openRouter.smartLogic }, // Edit Plan
    "13": { provider: "openrouter", model: aiModels.openRouter.smartLogic }, // Title Generation Deep Logic

    // 🎨 FAST CREATIVE / JSON AGENTS: OpenRouter (Llama 8B - High speed, $0.06/1M Tokens)
    "6": { provider: "openrouter", model: aiModels.openRouter.smartLogic }, // Concept
    "7": { provider: "openrouter", model: aiModels.openRouter.smartLogic }, // Thumbnail strategist
    "8": { provider: "openrouter", model: aiModels.openRouter.smartLogic }, // thumbnail Designer
    "9": { provider: "openrouter", model: aiModels.openRouter.smartLogic },    // SEO (Needs smart JSON logic)
    "10.5": { provider: "openrouter", model: aiModels.openRouter.smartLogic }, // Creative iteration
    "15": { provider: "openrouter", model: aiModels.openRouter.smartLogic } // Analytics
};
