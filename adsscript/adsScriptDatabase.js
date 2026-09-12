const { MongoClient } = require('mongodb');
const { randomUUID } = require('crypto');
const logger = require('../logger');

const COLLECTION_NAME = 'adsScriptProjects';

let client = null;
let dbPromise = null;

// Connect once at module load, reused across all requests (no per-request connections).
function getDb() {
    if (dbPromise) return dbPromise;

    const uri = process.env.ADS_MONGODB_URI;
    if (!uri) {
        dbPromise = Promise.reject(new Error(
            'ADS_MONGODB_URI is not set. The Ads Script Writer engine requires a MongoDB Atlas connection string in .env.'
        ));
        // Prevent an unhandled rejection warning for the startup probe; callers still get the rejection.
        dbPromise.catch(() => { });
        return dbPromise;
    }

    client = new MongoClient(uri);
    dbPromise = client.connect()
        .then(connected => {
            logger.info('Ads Script Writer: MongoDB connected.');
            return connected.db();
        })
        .catch(err => {
            logger.error({ err }, 'Ads Script Writer: MongoDB connection failed.');
            dbPromise = null; // allow a retry on the next call instead of caching the failure forever
            throw err;
        });

    return dbPromise;
}

async function getCollection() {
    const db = await getDb();
    return db.collection(COLLECTION_NAME);
}

async function listProjects() {
    const col = await getCollection();
    return col.find({}, {
        projection: { topic: 1, audienceId: 1, status: 1, createdAt: 1, updatedAt: 1, angleOptions: 1, scriptVersions: 1 }
    }).sort({ updatedAt: -1 }).toArray();
}

async function getProject(projectId) {
    const col = await getCollection();
    return col.findOne({ _id: projectId });
}

async function createProject({ topic, audienceId }) {
    const col = await getCollection();
    const now = new Date().toISOString();
    const doc = {
        _id: randomUUID(),
        topic,
        audienceId: audienceId || null,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        angleOptions: [],
        scriptVersions: []
    };
    await col.insertOne(doc);
    return doc;
}

async function updateProject(projectId, updates) {
    const col = await getCollection();
    const { _id, ...safeUpdates } = updates || {};
    const res = await col.findOneAndUpdate(
        { _id: projectId },
        { $set: { ...safeUpdates, updatedAt: new Date().toISOString() } },
        { returnDocument: 'after' }
    );
    return res?.value || res;
}

async function deleteProject(projectId) {
    const col = await getCollection();
    const res = await col.deleteOne({ _id: projectId });
    return res.deletedCount > 0;
}

// versionData must NOT include `version` — it's computed atomically here from the
// document's current scriptVersions length via an aggregation-pipeline update, so
// concurrent audit calls for the same project (double-click, two tabs) can't both read
// the same stale length and persist duplicate version numbers the way a plain
// read-then-$push from application code would.
async function addScriptVersion(projectId, versionData) {
    const col = await getCollection();
    const res = await col.findOneAndUpdate(
        { _id: projectId },
        [
            {
                $set: {
                    scriptVersions: {
                        $concatArrays: [
                            { $ifNull: ['$scriptVersions', []] },
                            [{
                                $mergeObjects: [
                                    versionData,
                                    { version: { $add: [{ $size: { $ifNull: ['$scriptVersions', []] } }, 1] } }
                                ]
                            }]
                        ]
                    },
                    status: 'script_ready',
                    updatedAt: new Date().toISOString()
                }
            }
        ],
        { returnDocument: 'after' }
    );
    return res?.value || res;
}

module.exports = {
    getDb,
    listProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    addScriptVersion
};
