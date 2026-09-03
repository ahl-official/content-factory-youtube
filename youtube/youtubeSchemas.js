const { z } = require('zod');

const topicOpportunitySchema = z.object({
    id: z.string(),
    topicIdea: z.string(),
    coreAudienceQuestion: z.string().optional(),
    whyItWorks: z.string().optional(),
    targetAudience: z.string().optional(),
    searchPotential: z.string().optional(),
    browsePotential: z.string().optional(),
    competitionLevel: z.string().optional(),
    contentGapStrength: z.string().optional(),
    businessFit: z.string().optional(),
    freshness: z.string().optional(),
    evidenceAvailability: z.string().optional(),
    confidence: z.string().optional(),
    supportingSignals: z.array(z.string()).optional()
});

const youtubeInsightsSchema = z.object({
    competitorPatterns: z.array(z.string()).optional(),
    recurringThemes: z.array(z.string()).optional(),
    observablePerformanceSignals: z.array(z.string()).optional(),
    opportunities: z.array(z.string()).optional()
});

const searchInsightsSchema = z.object({
    queryPatterns: z.array(z.string()).optional(),
    comparisonQueries: z.array(z.string()).optional(),
    problemQueries: z.array(z.string()).optional(),
    decisionQuestions: z.array(z.string()).optional()
});

const communityInsightsSchema = z.object({
    painPoints: z.array(z.string()).optional(),
    objections: z.array(z.string()).optional(),
    languageUsed: z.array(z.string()).optional(),
    recurringQuestions: z.array(z.string()).optional()
});

const youtubePackagingSchema = z.object({
    winningTitles: z.array(z.string()).optional(),
    thumbnailPatterns: z.array(z.string()).optional(),
    hookPatterns: z.array(z.string()).optional(),
    videoFormatPatterns: z.array(z.string()).optional()
});

const businessFitSchema = z.object({
    purchaseIntentLevel: z.string().optional(),
    audienceStage: z.string().optional(),
    consultationPotential: z.string().optional(),
    recommendedCtaDirection: z.string().optional()
});

const evidenceSchema = z.object({
    safeClaims: z.array(z.string()).optional(),
    claimsRequiringVerification: z.array(z.string()).optional(),
    claimsToAvoid: z.array(z.string()).optional(),
    // Fallback legacy support
    supportedFacts: z.array(z.string()).optional(),
    claimsNeedingVerification: z.array(z.string()).optional()
});

const researchSchema = z.object({
    topicSummary: z.string().optional(),
    audienceQuestions: z.array(z.string()).optional(),
    likelySearchIntent: z.string().optional(),
    likelyBrowsePotential: z.string().optional(),

    youtubeInsights: youtubeInsightsSchema.optional(),
    searchInsights: searchInsightsSchema.optional(),
    communityInsights: communityInsightsSchema.optional(),

    youtubePackaging: youtubePackagingSchema.optional(),
    businessFit: businessFitSchema.optional(),

    contentGaps: z.array(z.string()).optional(),
    evidence: evidenceSchema.optional(),

    risksOrWeaknesses: z.array(z.string()).optional(), // Legacy support but still useful
    researchDirections: z.array(z.string()).optional(),
    youtubeContentOpportunity: z.string().optional(),
    recommendedResearchOpportunity: z.string().optional(), // Legacy fallback
    recommendedResearchAngle: z.string().optional(), // Legacy fallback field
    confidenceNotes: z.string().optional(),

    sources: z.array(z.string()).optional(),
    sourceContextUsed: z.array(z.string()).optional(), // Legacy fallback field
    providerStatuses: z.any().optional(), // Flexible array/object

    topicOpportunities: z.array(topicOpportunitySchema).optional()
});

const angleItemSchema = z.object({
    id: z.string(),
    angleTitle: z.string(),
    coreConcept: z.string(),
    whyItWorks: z.string(),
    audiencePainPoint: z.string(),
    viewerPromise: z.string(),
    recommendedFormat: z.string(),
    hookExample: z.string(),
    businessIntent: z.string(),
    riskNotes: z.string()
});

const contentAngleSchema = z.object({
    angles: z.array(angleItemSchema),
    recommendedAngle: z.string()
});

const strategistSchema = z.object({
    primaryAudience: z.string(),
    viewerIntent: z.string(),
    searchVsBrowse: z.string(),
    evergreenVsTrending: z.string(),
    videoPromise: z.string(),
    positioning: z.string(),
    seriesPotential: z.string(),
    publishingStrategy: z.string(),
    risks: z.string(),
    successCriteria: z.string()
});

const chapterFlowSchema = z.object({
    chapterNumber: z.number(),
    chapterTitle: z.string(),
    purpose: z.string(),
    keyPoints: z.array(z.string())
});

const structureSchema = z.object({
    openingPromise: z.string(),
    hookStrategy: z.string(),
    storyArc: z.string(),
    curiosityLoops: z.array(z.string()),
    chapterFlow: z.array(chapterFlowSchema),
    midVideoRehooks: z.array(z.string()),
    pacingNotes: z.string(),
    expectedLength: z.string(),
    ctaPlacement: z.string(),
    endingStrategy: z.string(),
    structureWarnings: z.array(z.string())
});

const scriptChapterSchema = z.object({
    chapterTitle: z.string(),
    scriptText: z.string()
});

const scriptSchema = z.object({
    scriptTitle: z.string(),
    opening: z.string(),
    chapters: z.array(scriptChapterSchema),
    rehooks: z.array(z.string()),
    transitions: z.array(z.string()),
    cta: z.string(),
    ending: z.string(),
    fullScript: z.string().optional(),
    estimatedWordCount: z.number().optional(),
    estimatedDurationMinutes: z.number().optional()
});

const creativeDirectorSchema = z.object({
    chapters: z.array(z.object({
        chapter: z.string(),
        visualGoal: z.string(),
        shots: z.array(z.string()),
        bRoll: z.array(z.string()),
        graphics: z.array(z.string()),
        demonstrations: z.array(z.string())
    })),
    productionNotes: z.object({
        cameraStyle: z.string(),
        editingStyle: z.string(),
        visualTone: z.string(),
        propsRequired: z.array(z.string())
    })
});

const consultationStorySchema = z.object({
    emotionalConflict: z.string(),
    clientGoal: z.string(),
    keyConcern: z.string(),
    turningPoint: z.string(),
    decisionJourney: z.string(),
    authenticityNotes: z.string(),
    strongStoryMoments: z.array(z.string()),
    thingsNotToExaggerate: z.array(z.string())
});

const thumbnailStrategistSchema = z.object({
    thumbnailConcepts: z.array(z.object({
        id: z.string(),
        conceptName: z.string(),
        coreIdea: z.string(),
        viewerPsychology: z.string(),
        emotionalTrigger: z.string(),
        curiosityGap: z.string(),
        mainVisual: z.string(),
        expression: z.string(),
        frameSelection: z.string(),
        backgroundDirection: z.string(),
        thumbnailCopy: z.string(),
        composition: z.string(),
        whyItCouldWork: z.string(),
        risk: z.string()
    })),
    recommendedConceptId: z.string(),
    recommendationReason: z.string()
});

const thumbnailDesignerSchema = z.object({
    thumbnailDesign: z.object({
        conceptId: z.string(),
        layout: z.string(),
        composition: z.string(),
        subjectPlacement: z.string(),
        background: z.string(),
        typography: z.string(),
        thumbnailText: z.string(),
        colorDirection: z.string(),
        visualHierarchy: z.string(),
        editingInstructions: z.string(),
        aiImagePrompt: z.string()
    }),
    productionNotes: z.string(),
    recommendedExecution: z.string()
});

const titleStrategistSchema = z.object({
    titles: z.array(z.object({
        id: z.string(),
        title: z.string().min(1, "Title is required"),
        type: z.string().min(1, "Type is required"),
        ctrReason: z.string().min(1, "CTR Reason is required")
    })),
    recommendedTitleId: z.string(),
    recommendationReason: z.string().min(1, "Recommendation Reason is required")
});

const assetSuggestionSchema = z.union([
    z.string(),
    z.object({
        type: z.literal("future_content_opportunity"),
        suggestion: z.string()
    })
]);

const seoPackageSchema = z.object({
    seoPackage: z.object({
        primaryKeyword: z.string(),
        secondaryKeywords: z.array(z.string()),
        description: z.string(),
        chapters: z.array(z.object({
            timestamp: z.string(),
            title: z.string()
        })),
        tags: z.array(z.string()),
        hashtags: z.array(z.string()),
        playlistSuggestion: assetSuggestionSchema,
        pinnedComment: z.string(),
        endScreenSuggestion: assetSuggestionSchema,
        cardsSuggestion: assetSuggestionSchema
    })
});

const editorSchema = z.object({
    editingStyle: z.string(),
    timelinePlan: z.array(z.object({
        timestamp: z.string(),
        section: z.string(),
        editingAction: z.string(),
        visualElements: z.string(),
        retentionPurpose: z.string()
    })),
    requiredAssets: z.array(z.object({
        asset: z.string(),
        purpose: z.string(),
        availability: z.string()
    })),
    bRollSuggestions: z.array(z.string()),
    graphicsPlan: z.array(z.string()),
    soundDesign: z.object({
        musicDirection: z.string(),
        soundEffects: z.string(),
        voiceTreatment: z.string()
    }),
    transitionStrategy: z.string(),
    retentionOptimizations: z.array(z.string()),
    finalEditorNotes: z.string()
});

const retentionSchema = z.object({
    retentionScore: z.coerce.number(),
    openingAnalysis: z.object({
        strength: z.string(),
        weakness: z.string(),
        improvement: z.string()
    }),
    dropOffPredictions: z.array(z.object({
        section: z.string(),
        riskLevel: z.string(),
        reason: z.string(),
        recommendation: z.string()
    })),
    curiosityLoopAnalysis: z.array(z.string()),
    viewerPsychologyInsights: z.array(z.string()),
    unnecessarySections: z.array(z.string()),
    finalRecommendations: z.array(z.string())
});

const brandSchema = z.object({
    brandScore: z.number(),
    voiceReview: z.object({
        status: z.string(),
        feedback: z.string()
    }),
    claimReview: z.object({
        safeClaims: z.array(z.string()),
        riskyClaims: z.array(z.string())
    }),
    audienceAlignment: z.object({
        status: z.string(),
        feedback: z.string()
    }),
    ctaReview: z.object({
        status: z.string(),
        feedback: z.string()
    }),
    requiredChanges: z.array(z.string()),
    approvalStatus: z.string()
});

const qcSchema = z.object({
    overallScore: z.number(),
    checklist: z.object({
        hook: z.object({ score: z.number(), feedback: z.string() }),
        script: z.object({ score: z.number(), feedback: z.string() }),
        thumbnail: z.object({ score: z.number(), feedback: z.string() }),
        title: z.object({ score: z.number(), feedback: z.string() }),
        seo: z.object({ score: z.number(), feedback: z.string() }),
        brand: z.object({ score: z.number(), feedback: z.string() })
    }),
    criticalIssues: z.array(z.string()),
    improvements: z.array(z.string()),
    publishReady: z.boolean(),
    finalDecision: z.string()
});

const analyticsSchema = z.object({
    performanceSummary: z.string(),
    metricsAnalysis: z.object({
        retention: z.string(),
        watchTime: z.string(),
        subscriberImpact: z.string()
    }),
    retentionIssues: z.array(z.object({
        timestamp: z.string(),
        possibleReason: z.string(),
        improvement: z.string()
    })),
    successfulElements: z.array(z.string()),
    problemsFound: z.array(z.string()),
    futureRecommendations: z.array(z.string()),
    nextContentIdeas: z.array(z.string())
});

const metadataSchema = z.object({
    uploadMetadata: z.object({
        title: z.string(),
        description: z.string(),
        chapters: z.array(z.string()),
        tags: z.array(z.string()),
        hashtags: z.array(z.string()),
        category: z.string(),
        playlistSuggestion: z.string(),
        audienceType: z.string(),
        language: z.string(),
        pinnedCommentSuggestion: z.string()
    }),
    searchOptimization: z.object({
        primaryKeyword: z.string(),
        secondaryKeywords: z.array(z.string()),
        relatedSearchTerms: z.array(z.string()),
        faqKeywords: z.array(z.string())
    }),
    publishingRecommendations: z.object({
        endScreenSuggestion: z.string(),
        cardPlacement: z.array(z.string()),
        relatedVideos: z.array(z.string()),
        playlistRecommendation: z.string()
    }),
    brandSafetyCheck: z.object({
        exaggeratedClaimsAvoided: z.boolean(),
        guaranteedOutcomesAvoided: z.boolean(),
        misleadingTitlesAvoided: z.boolean(),
        premiumEducationalToneMaintained: z.boolean(),
        analysis: z.string()
    })
});

module.exports = {
    researchSchema,
    contentAngleSchema,
    strategistSchema,
    structureSchema,
    scriptSchema,
    consultationStorySchema,
    creativeDirectorSchema,
    thumbnailStrategistSchema,
    thumbnailDesignerSchema,
    titleStrategistSchema,
    seoPackageSchema,
    metadataSchema,
    editorSchema,
    retentionSchema,
    brandSchema,
    qcSchema,
    analyticsSchema
};
