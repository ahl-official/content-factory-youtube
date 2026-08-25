const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const logger = require('../logger');
const config = require('../config');

let docInitPromise = null;

async function getDoc() {
    if (docInitPromise) return docInitPromise;

    if (!process.env.YT_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        logger.warn("YouTube Sheet credentials missing.");
        return Promise.resolve(null);
    }

    docInitPromise = (async () => {
        try {
            const serviceAccountAuth = new JWT({
                email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
            const doc = new GoogleSpreadsheet(process.env.YT_SHEET_ID, serviceAccountAuth);
            await doc.loadInfo();
            return doc;
        } catch (e) {
            logger.error({ err: e }, "Failed to init YouTube Google Sheets DB");
            docInitPromise = null;
            return null;
        }
    })();

    return docInitPromise;
}

const TABS = {
    PROJECTS: 'YT_Projects',
    AGENT_RUNS: 'YT_AgentRuns',
    RESEARCH: 'YT_Research',
    FEEDBACK: 'YT_Feedback',
    SCRIPTS: 'YT_Scripts',
    ASSETS: 'YT_Assets',
    ANALYTICS: 'YT_Analytics',
    SETTINGS: 'YT_Settings',
    TOPICS: 'YT_TopicRegistry',
    CREATIVE_PLAN: 'YT_CreativePlan',
    THUMBNAIL_CONCEPTS: 'YT_ThumbnailConcepts',
    THUMBNAIL_DESIGN: 'YT_ThumbnailDesign',
    TITLE_OPTIONS: 'YT_TitleOptions',
    SEO_PACKAGE: 'YT_SEOPackage',
    EDIT_PLAN: 'YT_EditPlan',
    RETENTION_REVIEW: 'YT_RetentionReview',
    BRAND_REVIEW: 'YT_BrandReview',
    QC_REVIEW: 'YT_QCReview'
};

const HEADERS = {
    [TABS.PROJECTS]: ['ProjectID', 'WorkingTitle', 'SourceType', 'TargetAudience', 'BusinessObjective', 'Strategy', 'ContentType', 'Notes', 'Status', 'CurrentStage', 'CurrentAgent', 'Progress', 'IsConsultation', 'CreatedAt', 'UpdatedAt', 'PublishedVideoID', 'PublishedURL', 'consultationTranscript', 'consultationContext', 'consultationTurningPoint', 'transformationBefore', 'transformationChanged', 'transformationAfter', 'transformationTurningPoint', 'transformationFocus', 'referenceUrl', 'referenceLearnings', 'referenceNotes', 'ReferenceFileName', 'ReferenceFileType', 'ReferenceFileSize', 'ResearchBehavior'],
    [TABS.AGENT_RUNS]: ['RunID', 'ProjectID', 'AgentKey', 'AgentName', 'Version', 'InputData', 'OutputData', 'Feedback', 'Status', 'IsApproved', 'CreatedAt', 'UpdatedAt', 'ApprovedAt'],
    [TABS.RESEARCH]: ['ResearchID', 'ProjectID', 'ResearchVersion', 'ResearchMode', 'ResearchSeed', 'CanonicalTopic', 'SourceType', 'ResearchStatus', 'ResearchSummary', 'TopicOpportunities', 'AudienceQuestions', 'YouTubeInsights', 'SearchInsights', 'CommunityInsights', 'ContentGaps', 'Evidence', 'ResearchDirections', 'RecommendedOpportunity', 'Sources', 'ProviderStatuses', 'Approved', 'CreatedAt', 'UpdatedAt'],
    [TABS.FEEDBACK]: ['FeedbackID', 'ProjectID', 'Stage', 'AgentKey', 'Version', 'FeedbackType', 'FeedbackText', 'Source', 'IsSirFeedback', 'CreatedAt'],
    [TABS.SCRIPTS]: ['ScriptID', 'ProjectID', 'Version', 'ScriptText', 'BasedOnRunID', 'FeedbackSummary', 'IsApproved', 'CreatedAt', 'ApprovedAt'],
    [TABS.ASSETS]: ['AssetID', 'ProjectID', 'AssetType', 'Version', 'AssetData', 'IsApproved', 'CreatedAt'],
    [TABS.ANALYTICS]: ['AnalyticsID', 'ProjectID', 'VideoID', 'SnapshotDate', 'CTR', 'WatchTime', 'AverageViewDuration', 'AveragePercentageViewed', 'SubscribersGained', 'Comments', 'Leads', 'RetentionData', 'Insight', 'AgentID', 'Version', 'InputSnapshot', 'OutputJSON', 'Status', 'CreatedAt'],
    [TABS.SETTINGS]: ['SettingKey', 'SettingValue', 'UpdatedAt'],
    [TABS.TOPICS]: ['TopicID', 'ProjectID', 'OriginalTitle', 'CanonicalTopic', 'NormalizedTopic', 'Angle', 'Status', 'PublishedURL', 'CreatedAt'],
    [TABS.CREATIVE_PLAN]: ['PlanID', 'ProjectID', 'AgentID', 'Version', 'InputSnapshot', 'OutputJSON', 'Status', 'CreatedAt'],
    [TABS.THUMBNAIL_CONCEPTS]: ['ThumbConceptID', 'ProjectID', 'AgentID', 'Version', 'InputSnapshot', 'OutputJSON', 'Status', 'CreatedAt'],
    [TABS.THUMBNAIL_DESIGN]: ['ThumbnailDesignID', 'ProjectID', 'AgentID', 'Version', 'InputSnapshot', 'OutputJSON', 'Status', 'CreatedAt'],
    [TABS.TITLE_OPTIONS]: ['TitleOptionID', 'ProjectID', 'AgentID', 'Version', 'InputSnapshot', 'OutputJSON', 'Status', 'CreatedAt'],
    [TABS.SEO_PACKAGE]: ['SeoPackageID', 'ProjectID', 'AgentID', 'Version', 'InputSnapshot', 'OutputJSON', 'Status', 'CreatedAt'],
    [TABS.EDIT_PLAN]: ['EditPlanID', 'ProjectID', 'AgentID', 'Version', 'InputSnapshot', 'OutputJSON', 'Status', 'CreatedAt'],
    [TABS.RETENTION_REVIEW]: ['RetentionID', 'ProjectID', 'AgentID', 'Version', 'InputSnapshot', 'OutputJSON', 'Status', 'CreatedAt'],
    [TABS.BRAND_REVIEW]: ['BrandReviewID', 'ProjectID', 'AgentID', 'Version', 'InputSnapshot', 'OutputJSON', 'Status', 'CreatedAt'],
    [TABS.QC_REVIEW]: ['QcReviewID', 'ProjectID', 'AgentID', 'Version', 'InputSnapshot', 'OutputJSON', 'Status', 'CreatedAt']
};

async function initializeYoutubeSheets() {
    const d = await getDoc();
    if (!d) return false;

    for (const [key, title] of Object.entries(TABS)) {
        let sheet = d.sheetsByTitle[title];
        if (!sheet) {
            sheet = await d.addSheet({ title, headerValues: HEADERS[title] });
        } else {
            // Just ensure the headers are there, but do not clear rows!
            await sheet.loadHeaderRow().catch(() => { });
            if (!sheet.headerValues || sheet.headerValues.length === 0 || sheet.headerValues.length < HEADERS[title].length) {
                if (sheet.columnCount < HEADERS[title].length) {
                    await sheet.resize({ rowCount: sheet.rowCount || 100, columnCount: HEADERS[title].length });
                }
                await sheet.setHeaderRow(HEADERS[title]);
            }
        }
    }
    return true;
}

// Helpers
const parseIfPossible = val => {
    try { return JSON.parse(val); } catch (e) { return val; }
};

const formatRow = (r) => {
    if (r && typeof r.toObject === 'function') {
        const obj = r.toObject();
        const res = {};
        for (const h in obj) {
            let val = obj[h];
            if (val !== undefined && val !== null && val !== '') {
                if (typeof val === 'string') {
                    if (val.trim().toUpperCase() === 'TRUE') val = true;
                    else if (val.trim().toUpperCase() === 'FALSE') val = false;
                }
                res[h] = typeof val === 'boolean' ? val : parseIfPossible(val);
            }
        }
        return res;
    }
    return r; // Fallback
};

async function listProjects() {
    const d = await getDoc();
    if (!d) return [];
    const sheet = d.sheetsByTitle[TABS.PROJECTS];
    if (!sheet) return [];
    const rows = await sheet.getRows();
    return rows.map(formatRow);
}

async function getProject(projectId) {
    const projects = await listProjects();
    return projects.find(p => p.ProjectID === projectId) || null;
}

async function getNextProjectId() {
    const projects = await listProjects();
    if (!projects.length) return 'YT-001';
    let maxId = 0;
    for (const p of projects) {
        if (p.ProjectID && p.ProjectID.startsWith('YT-')) {
            const num = parseInt(p.ProjectID.replace('YT-', ''), 10);
            if (!isNaN(num) && num > maxId) maxId = num;
        }
    }
    return `YT-${String(maxId + 1).padStart(3, '0')}`;
}

async function createProject(projectData) {
    const d = await getDoc();
    if (!d) return null;
    const sheet = d.sheetsByTitle[TABS.PROJECTS];
    const ProjectID = await getNextProjectId();

    const SourceType = projectData.SourceType || 'Original Topic';
    const IsConsultation = SourceType === 'Consultation' ? 'TRUE' : 'FALSE';
    const Progress = '0';
    delete projectData.PublishedVideoID;
    delete projectData.PublishedURL;
    delete projectData.Angle;

    const rowData = {
        ...projectData,
        ProjectID,
        IsConsultation,
        Progress,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString()
    };

    const formattedRow = {};
    for (const k of Object.keys(rowData)) {
        if (HEADERS[TABS.PROJECTS].includes(k)) {
            formattedRow[k] = typeof rowData[k] === 'object' ? JSON.stringify(rowData[k]) : String(rowData[k]);
        }
    }

    await sheet.addRow(formattedRow);
    return rowData;
}

async function updateProject(projectId, updates) {
    const d = await getDoc();
    if (!d) return null;
    const sheet = d.sheetsByTitle[TABS.PROJECTS];
    const rows = await sheet.getRows();
    const index = rows.findIndex(r => r.get('ProjectID') === projectId);
    if (index >= 0) {
        updates.UpdatedAt = new Date().toISOString();
        Object.keys(updates).forEach(k => {
            if (HEADERS[TABS.PROJECTS].includes(k)) {
                rows[index].set(k, typeof updates[k] === 'object' ? JSON.stringify(updates[k]) : String(updates[k]));
            }
        });
        await rows[index].save();
        return formatRow(rows[index]);
    }
    return null;
}

async function createAgentRun(runData) {
    const d = await getDoc();
    if (!d) return null;
    const sheet = d.sheetsByTitle[TABS.AGENT_RUNS];

    const rowData = { ...runData, RunID: `RUN-${Date.now()}`, CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() };
    const formattedRow = {};
    for (const k of Object.keys(rowData)) {
        if (HEADERS[TABS.AGENT_RUNS].includes(k)) {
            formattedRow[k] = typeof rowData[k] === 'object' ? JSON.stringify(rowData[k]) : String(rowData[k]);
        }
    }

    await sheet.addRow(formattedRow);
    return rowData;
}

async function getAgentRuns(projectId) {
    const d = await getDoc();
    if (!d) return [];
    const sheet = d.sheetsByTitle[TABS.AGENT_RUNS];
    const rows = await sheet.getRows();
    return rows.map(formatRow).filter(r => r.ProjectID === projectId);
}

async function getAgentRun(projectId, agentKey, version) {
    const runs = await getAgentRuns(projectId);
    return runs.find(r => r.AgentKey === agentKey && String(r.Version) === String(version)) || null;
}

async function saveFeedback(feedbackData) {
    const d = await getDoc();
    if (!d) return null;
    const sheet = d.sheetsByTitle[TABS.FEEDBACK];

    const rowData = { ...feedbackData, FeedbackID: `FB-${Date.now()}`, CreatedAt: new Date().toISOString() };
    const formattedRow = {};
    for (const k of Object.keys(rowData)) {
        if (HEADERS[TABS.FEEDBACK].includes(k)) {
            formattedRow[k] = typeof rowData[k] === 'object' ? JSON.stringify(rowData[k]) : String(rowData[k]);
        }
    }

    await sheet.addRow(formattedRow);
    return rowData;
}

async function getFeedback(projectId) {
    const d = await getDoc();
    if (!d) return [];
    const sheet = d.sheetsByTitle[TABS.FEEDBACK];
    const rows = await sheet.getRows();
    return rows.map(formatRow).filter(r => r.ProjectID === projectId);
}

async function saveResearch(researchData) {
    const d = await getDoc();
    if (!d) return null;
    const sheet = d.sheetsByTitle[TABS.RESEARCH];
    const rowData = { ...researchData, ResearchID: `RES-${Date.now()}`, CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() };
    const formattedRow = {};
    const missingColumns = [];

    // Check missing columns based on headers
    HEADERS[TABS.RESEARCH].forEach(h => {
        if (rowData[h] === undefined || rowData[h] === null) {
            missingColumns.push(h);
        }
    });

    for (const k of Object.keys(rowData)) {
        if (HEADERS[TABS.RESEARCH].includes(k)) {
            formattedRow[k] = typeof rowData[k] === 'object' ? JSON.stringify(rowData[k]) : String(rowData[k]);
        }
    }

    logger.info({
        projectId: researchData.ProjectID,
        agent: '1',
        sheet: TABS.RESEARCH,
        missingColumns,
        outputKeys: Object.keys(researchData)
    }, '[Persistence Audit] Agent Save Missing Columns Check');

    await sheet.addRow(formattedRow);
    return rowData;
}

async function getResearch(projectId) {
    const d = await getDoc();
    if (!d) return [];
    const sheet = d.sheetsByTitle[TABS.RESEARCH];
    const rows = await sheet.getRows();
    return rows.map(formatRow).filter(r => r.ProjectID === projectId);
}

async function saveCustomData(tabName, data) {
    const d = await getDoc();
    if (!d) return null;
    const sheet = d.sheetsByTitle[tabName];
    if (!sheet) return null;
    const idCol = HEADERS[tabName][0];
    const rowData = { ...data, [idCol]: `ID-${Date.now()}`, CreatedAt: new Date().toISOString() };
    const formattedRow = {};
    for (const k of Object.keys(rowData)) {
        if (HEADERS[tabName].includes(k)) {
            formattedRow[k] = typeof rowData[k] === 'object' ? JSON.stringify(rowData[k]) : String(rowData[k]);
        }
    }
    await sheet.addRow(formattedRow);
    return rowData;
}

async function saveScriptVersion(scriptData) {
    const d = await getDoc();
    if (!d) return null;
    const sheet = d.sheetsByTitle[TABS.SCRIPTS];

    const rowData = { ...scriptData, ScriptID: `SCR-${Date.now()}`, CreatedAt: new Date().toISOString() };
    const formattedRow = {};
    for (const k of Object.keys(rowData)) {
        if (HEADERS[TABS.SCRIPTS].includes(k)) {
            formattedRow[k] = typeof rowData[k] === 'object' ? JSON.stringify(rowData[k]) : String(rowData[k]);
        }
    }
    await sheet.addRow(formattedRow);
    return rowData;
}

async function getScriptVersions(projectId) {
    const d = await getDoc();
    if (!d) return [];
    const sheet = d.sheetsByTitle[TABS.SCRIPTS];
    const rows = await sheet.getRows();
    return rows.map(formatRow).filter(r => r.ProjectID === projectId);
}

async function saveAsset(assetData) {
    const d = await getDoc();
    if (!d) return null;
    const sheet = d.sheetsByTitle[TABS.ASSETS];
    const rowData = { ...assetData, AssetID: `AST-${Date.now()}`, CreatedAt: new Date().toISOString() };
    const formattedRow = {};
    for (const k of Object.keys(rowData)) {
        if (HEADERS[TABS.ASSETS].includes(k)) {
            formattedRow[k] = typeof rowData[k] === 'object' ? JSON.stringify(rowData[k]) : String(rowData[k]);
        }
    }
    await sheet.addRow(formattedRow);
    return rowData;
}

async function getAssets(projectId) {
    const d = await getDoc();
    if (!d) return [];
    const sheet = d.sheetsByTitle[TABS.ASSETS];
    const rows = await sheet.getRows();
    return rows.map(formatRow).filter(r => r.ProjectID === projectId);
}

async function saveAnalyticsSnapshot(analyticsData) {
    const d = await getDoc();
    if (!d) return null;
    const sheet = d.sheetsByTitle[TABS.ANALYTICS];
    const rowData = { ...analyticsData, AnalyticsID: `ANL-${Date.now()}` };
    const formattedRow = {};
    for (const k of Object.keys(rowData)) {
        if (HEADERS[TABS.ANALYTICS].includes(k)) {
            formattedRow[k] = typeof rowData[k] === 'object' ? JSON.stringify(rowData[k]) : String(rowData[k]);
        }
    }
    await sheet.addRow(formattedRow);
    return rowData;
}

async function getAnalytics(projectId) {
    const d = await getDoc();
    if (!d) return [];
    const sheet = d.sheetsByTitle[TABS.ANALYTICS];
    const rows = await sheet.getRows();
    return rows.map(formatRow).filter(r => r.ProjectID === projectId);
}

async function upsertAgentArtifact(options) {
    const { sheetName, projectId, agentId, version, inputSnapshot, outputJson, status } = options;
    const d = await getDoc();
    if (!d) return null;
    const sheet = d.sheetsByTitle[sheetName];
    if (!sheet) return null;

    await sheet.loadHeaderRow().catch(() => { });
    const currentHeaders = sheet.headerValues || HEADERS[sheetName] || [];
    const idCol = currentHeaders[0];

    const existingIndex = (await sheet.getRows()).findIndex(r =>
        r.get('ProjectID') === projectId &&
        String(r.get('AgentID')) === String(agentId) &&
        String(r.get('Version')) === String(version)
    );

    const safeStringify = (val) => typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val || '');

    // Deep Flatten outputJson into ultra-readable columns
    let flatOutput = {};
    if (outputJson && typeof outputJson === 'object') {
        const flattenDeep = (obj, prefix = '') => {
            let res = {};
            for (const k in obj) {
                const colName = prefix ? `${prefix}_${k}` : k;
                const val = obj[k];
                if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
                    res = { ...res, ...flattenDeep(val, colName) };
                } else if (Array.isArray(val)) {
                    res[colName] = val.map(i => typeof i === 'object' ? JSON.stringify(i) : String(i)).join('\n• ');
                } else {
                    res[colName] = String(val !== undefined && val !== null ? val : '');
                }
            }
            return res;
        };
        flatOutput = flattenDeep(outputJson);
    }

    // Ensure headers exist
    let newHeaders = [...currentHeaders];
    let headersAdded = false;
    for (const key of Object.keys(flatOutput)) {
        if (!newHeaders.includes(key)) {
            newHeaders.push(key);
            headersAdded = true;
        }
    }

    if (headersAdded) {
        if (sheet.columnCount < newHeaders.length) {
            await sheet.resize({ rowCount: sheet.rowCount || 100, columnCount: newHeaders.length + 5 });
        }
        await sheet.setHeaderRow(newHeaders);
    }

    const rows = await sheet.getRows();
    const targetIdx = rows.findIndex(r =>
        r.get('ProjectID') === projectId &&
        String(r.get('AgentID')) === String(agentId) &&
        String(r.get('Version')) === String(version)
    );

    if (targetIdx >= 0) {
        if (inputSnapshot !== undefined && newHeaders.includes('InputSnapshot')) {
            rows[targetIdx].set('InputSnapshot', safeStringify(inputSnapshot));
        }
        if (outputJson !== undefined && newHeaders.includes('OutputJSON')) {
            rows[targetIdx].set('OutputJSON', safeStringify(outputJson)); // keep raw backup
        }
        if (status !== undefined && newHeaders.includes('Status')) {
            rows[targetIdx].set('Status', safeStringify(status));
        }
        rows[targetIdx].set('UpdatedAt', new Date().toISOString());

        for (const [k, v] of Object.entries(flatOutput)) {
            rows[targetIdx].set(k, v);
        }

        await rows[targetIdx].save();
        return formatRow(rows[targetIdx]);
    } else {
        const rowData = {
            [idCol]: `${projectId}-A${agentId}-V${version}`,
            ProjectID: projectId,
            AgentID: String(agentId),
            Version: String(version)
        };
        if (newHeaders.includes('InputSnapshot')) rowData.InputSnapshot = safeStringify(inputSnapshot);
        if (newHeaders.includes('OutputJSON')) rowData.OutputJSON = safeStringify(outputJson); // keep raw backup
        if (newHeaders.includes('Status')) rowData.Status = safeStringify(status || 'Generated');
        if (newHeaders.includes('CreatedAt')) rowData.CreatedAt = new Date().toISOString();

        for (const [k, v] of Object.entries(flatOutput)) {
            rowData[k] = v;
        }

        const missingColumns = [];
        currentHeaders.forEach(h => {
            if (rowData[h] === undefined || rowData[h] === null || rowData[h] === '') {
                missingColumns.push(h);
            }
        });

        logger.info({
            projectId: projectId,
            agent: agentId,
            sheet: sheetName,
            missingColumns,
            outputKeys: Object.keys(flatOutput)
        }, '[Persistence Audit] Dynamic Agent Save Missing Columns Check');

        await sheet.addRow(rowData);
        return rowData;
    }
}

function normalizeTopic(title) {
    if (!title) return '';
    return title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

async function checkExactDuplicateTopic(title) {
    const d = await getDoc();
    if (!d) return { type: 'none' };

    const sheet = d.sheetsByTitle[TABS.TOPICS];
    if (!sheet) return { type: 'none' };
    const rows = await sheet.getRows();
    const normTitle = normalizeTopic(title);

    for (const row of rows) {
        if (row.get('NormalizedTopic') === normTitle) {
            return {
                type: 'exact',
                projectId: row.get('ProjectID'),
                title: row.get('OriginalTitle'),
                status: row.get('Status') || 'Existing'
            };
        }
    }
    return { type: 'none' };
}

async function registerTopic(topicData) {
    const d = await getDoc();
    if (!d) return null;

    const sheet = d.sheetsByTitle[TABS.TOPICS];
    const docTitle = typeof topicData.OriginalTitle === 'string' ? topicData.OriginalTitle : topicData.title;
    const rowData = {
        ...topicData,
        CanonicalTopic: topicData.CanonicalTopic || docTitle,
        OriginalTitle: docTitle,
        NormalizedTopic: normalizeTopic(topicData.CanonicalTopic || docTitle),
        TopicID: `TOPIC-${Date.now()}`,
        CreatedAt: new Date().toISOString()
    };

    const formattedRow = {};
    for (const k of Object.keys(rowData)) {
        if (HEADERS[TABS.TOPICS].includes(k)) {
            formattedRow[k] = typeof rowData[k] === 'object' ? JSON.stringify(rowData[k]) : String(rowData[k]);
        }
    }

    await sheet.addRow(formattedRow);
    return rowData;
}

async function getSettings() {
    const d = await getDoc();
    if (!d) return {};
    const sheet = d.sheetsByTitle[TABS.SETTINGS];
    const rows = await sheet.getRows();
    const settings = {};
    rows.forEach(r => {
        settings[r.get('SettingKey')] = parseIfPossible(r.get('SettingValue'));
    });
    return settings;
}

async function updateSetting(key, value) {
    const d = await getDoc();
    if (!d) return false;
    const sheet = d.sheetsByTitle[TABS.SETTINGS];
    const rows = await sheet.getRows();
    const index = rows.findIndex(r => r.get('SettingKey') === key);

    const stringVal = typeof value === 'object' ? JSON.stringify(value) : String(value);

    if (index >= 0) {
        rows[index].set('SettingValue', stringVal);
        rows[index].set('UpdatedAt', new Date().toISOString());
        await rows[index].save();
    } else {
        await sheet.addRow({
            SettingKey: key,
            SettingValue: stringVal,
            UpdatedAt: new Date().toISOString()
        });
    }
    return true;
}

async function approveAgentRun(projectId, runId, selectedAngleId = null) {
    const d = await getDoc();
    if (!d) return false;
    const sheet = d.sheetsByTitle[TABS.AGENT_RUNS];
    const rows = await sheet.getRows();
    const index = rows.findIndex(r => r.get('ProjectID') === projectId && r.get('RunID') === runId);

    if (index >= 0) {
        rows[index].set('IsApproved', 'true');
        rows[index].set('ApprovedAt', new Date().toISOString());
        rows[index].set('UpdatedAt', new Date().toISOString());

        if (selectedAngleId) {
            try {
                let outData = rows[index].get('OutputData');
                if (typeof outData === 'string') {
                    let parsed = JSON.parse(outData);
                    parsed.selectedAngleId = selectedAngleId;
                    rows[index].set('OutputData', JSON.stringify(parsed));
                }
            } catch (e) { }
        }

        await rows[index].save();
        return true;
    }
    return false;
}

async function updateAgentRunFeedback(projectId, agentKey, version, feedbackText) {
    const d = await getDoc();
    if (!d) return false;
    const sheet = d.sheetsByTitle[TABS.AGENT_RUNS];
    const rows = await sheet.getRows();
    const run = rows.find(r => r.get('ProjectID') === projectId && r.get('AgentKey') === agentKey && String(r.get('Version')) === String(version));
    if (run) {
        run.set('Feedback', feedbackText);
        run.set('UpdatedAt', new Date().toISOString());
        await run.save();
        return true;
    }
    return false;
}

async function approveScriptVersion(projectId, basedOnRunId) {
    const d = await getDoc();
    if (!d) return false;
    const sheet = d.sheetsByTitle[TABS.SCRIPTS];
    const rows = await sheet.getRows();
    let changed = false;
    const nowStr = new Date().toISOString();
    for (const r of rows) {
        if (r.get('ProjectID') === projectId) {
            if (r.get('BasedOnRunID') === basedOnRunId) {
                r.set('IsApproved', 'true');
                r.set('ApprovedAt', nowStr);
                await r.save();
                changed = true;
            } else if (String(r.get('IsApproved')).toLowerCase() === 'true') {
                r.set('IsApproved', 'false');
                r.set('ApprovedAt', '');
                await r.save();
            }
        }
    }
    return changed;
}

async function submitAgentRunToSir(projectId, runId, selectedAngleId = null) {
    const d = await getDoc();
    if (!d) return false;
    const sheet = d.sheetsByTitle[TABS.AGENT_RUNS];
    const rows = await sheet.getRows();
    const index = rows.findIndex(r => r.get('ProjectID') === projectId && r.get('RunID') === runId);

    if (index >= 0) {
        rows[index].set('Status', 'Waiting for Sir');
        rows[index].set('UpdatedAt', new Date().toISOString());

        if (selectedAngleId) {
            try {
                let outData = rows[index].get('OutputData');
                if (typeof outData === 'string') {
                    let parsed = JSON.parse(outData);
                    parsed.selectedAngleId = selectedAngleId;
                    rows[index].set('OutputData', JSON.stringify(parsed));
                }
            } catch (e) { }
        }

        await rows[index].save();
        return true;
    }
    return false;
}

async function unapproveAgentRun(projectId, agentKey) {
    const d = await getDoc();
    if (!d) return false;
    const sheet = d.sheetsByTitle[TABS.AGENT_RUNS];
    const rows = await sheet.getRows();
    let changed = false;
    for (const r of rows) {
        if (r.get('ProjectID') === projectId && r.get('AgentKey') === agentKey && String(r.get('IsApproved')).toLowerCase() === 'true') {
            r.set('IsApproved', 'false');
            r.set('UpdatedAt', new Date().toISOString());
            await r.save();
            changed = true;
        }
    }
    return changed;
}

async function updateTopicRegistryAngle(projectId, angleText) {
    const d = await getDoc();
    if (!d) return false;
    const sheet = d.sheetsByTitle[TABS.TOPICS];
    const rows = await sheet.getRows();
    const topicRow = rows.find(r => r.get('ProjectID') === projectId);
    if (topicRow) {
        topicRow.set('Angle', angleText);
        await topicRow.save();
        return true;
    }
    return false;
}

async function updateTopicRegistryTopic(projectId, canonicalTopic) {
    const d = await getDoc();
    if (!d) return false;
    const sheet = d.sheetsByTitle[TABS.TOPICS];
    const rows = await sheet.getRows();
    const topicRow = rows.find(r => r.get('ProjectID') === projectId);
    if (topicRow) {
        topicRow.set('CanonicalTopic', canonicalTopic);
        topicRow.set('NormalizedTopic', normalizeTopic(canonicalTopic));
        await topicRow.save();
        return true;
    }
    return false;
}

async function getTopicRegistryEntry(projectId) {
    const d = await getDoc();
    if (!d) return null;
    const sheet = d.sheetsByTitle[TABS.TOPICS];
    const rows = await sheet.getRows();
    const topicRow = rows.find(r => r.get('ProjectID') === projectId);
    return topicRow ? formatRow(topicRow) : null;
}

module.exports = {
    initializeYoutubeSheets,
    listProjects,
    getProject,
    createProject,
    updateProject,
    getNextProjectId,
    createAgentRun,
    getAgentRuns,
    getAgentRun,
    approveAgentRun,
    unapproveAgentRun,
    saveFeedback,
    getFeedback,
    saveResearch,
    getResearch,
    saveScriptVersion,
    getScriptVersions,
    saveAsset,
    getAssets,
    saveAnalyticsSnapshot,
    getAnalytics,
    checkExactDuplicateTopic,
    registerTopic,
    getSettings,
    updateSetting,
    approveAgentRun,
    submitAgentRunToSir,
    unapproveAgentRun,
    updateTopicRegistryAngle,
    updateTopicRegistryTopic,
    getTopicRegistryEntry,
    saveCustomData,
    upsertAgentArtifact,
    updateAgentRunFeedback,
    approveScriptVersion
};
