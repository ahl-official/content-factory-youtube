const { z } = require('zod');

const adAngleItemSchema = z.object({
    id: z.string(),
    angleTitle: z.string(),
    // Optional: projects saved before the hook library existed have no hookType.
    hookType: z.string().optional(),
    hookLine: z.string(),
    audiencePainPoint: z.string(),
    awarenessStage: z.string(),
    whyItWorks: z.string(),
    riskNotes: z.string().optional()
});

const adAngleSchema = z.object({
    angleOptions: z.array(adAngleItemSchema),
    recommendedAngleId: z.string()
});

const adScriptSchema = z.object({
    hook: z.string(),
    body: z.string(),
    cta: z.string(),
    fullScript: z.string(),
    estimatedRuntimeSeconds: z.number().optional()
});

const adAuditSchema = z.object({
    auditNotes: z.array(z.string()),
    finalScript: adScriptSchema
});

module.exports = { adAngleSchema, adScriptSchema, adAuditSchema };
