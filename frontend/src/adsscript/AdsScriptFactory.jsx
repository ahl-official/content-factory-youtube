import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api');

const STAGE_LABELS = {
  draft: 'Draft',
  angles_generated: 'Angles Ready',
  script_ready: 'Script Ready ✓'
};

/*
 * Ads Script Writer — a focused, native pipeline for writing Meta ad scripts
 * for a specific audience segment. Mirrors the YoutubeFactory pattern
 * (dashboard -> new project -> workspace) but scoped to 3 stages:
 * Ad Angle -> Script Writer -> Audit. Persists to MongoDB via /api/ads.
 */
export default function AdsScriptFactory({ activeAudience, targetAudiences = [], sirStyleGuide }) {
  const [view, setView] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [listError, setListError] = useState(null);

  const fetchProjects = () => {
    setLoadingProjects(true);
    fetch(`${API_URL}/ads/projects`)
      .then(res => {
        if (!res.ok) return res.json().then(d => Promise.reject(new Error(d.error || `HTTP ${res.status}`)));
        return res.json();
      })
      .then(data => {
        setProjects(Array.isArray(data) ? data : []);
        setListError(null);
      })
      .catch(e => setListError(e.message))
      .finally(() => setLoadingProjects(false));
  };

  useEffect(() => { fetchProjects(); }, []);
  useEffect(() => { if (view === 'dashboard') fetchProjects(); }, [view]);

  const currentProject = projects.find(p => p._id === activeProjectId);

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid var(--panel-border)', paddingBottom: '1rem' }}>
        <h2 style={{ margin: '0 1rem 0 0', fontSize: '1.2rem' }}>📢 Ads Script Writer</h2>
        <button className={`btn ${view === 'dashboard' ? '' : 'btn-secondary'}`} onClick={() => { setView('dashboard'); setActiveProjectId(null); }}>
          Projects {projects.length > 0 && `(${projects.length})`}
        </button>
        <button className={`btn ${view === 'new_project' ? '' : 'btn-secondary'}`} onClick={() => { setView('new_project'); setActiveProjectId(null); }}>
          + New Ad Project
        </button>
        {activeProjectId && view !== 'workspace' && (
          <button className="btn" style={{ marginLeft: 'auto' }} onClick={() => setView('workspace')}>⬅ Return to Project</button>
        )}
      </div>

      {view === 'dashboard' && (
        <AdsDashboard
          projects={projects}
          loading={loadingProjects}
          error={listError}
          targetAudiences={targetAudiences}
          onOpen={(id) => { setActiveProjectId(id); setView('workspace'); }}
          onDelete={async (id) => {
            if (!window.confirm('Delete this ad project? This cannot be undone.')) return;
            try {
              const res = await fetch(`${API_URL}/ads/projects/${id}`, { method: 'DELETE' });
              if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Delete failed');
              setProjects(projects.filter(p => p._id !== id));
            } catch (e) {
              setListError(e.message);
            }
          }}
        />
      )}

      {view === 'new_project' && (
        <AdsNewProject
          targetAudiences={targetAudiences}
          activeAudience={activeAudience}
          onCreate={async ({ topic, audienceId }) => {
            const res = await fetch(`${API_URL}/ads/projects`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ topic, audienceId })
            });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to create project');
            const created = await res.json();
            setProjects([created, ...projects]);
            setActiveProjectId(created._id);
            setView('workspace');
          }}
        />
      )}

      {view === 'workspace' && currentProject && (
        <AdsWorkspace
          key={currentProject._id}
          project={currentProject}
          targetAudiences={targetAudiences}
          sirStyleGuide={sirStyleGuide}
          onBack={() => { setView('dashboard'); setActiveProjectId(null); }}
          onProjectUpdated={(updated) => setProjects(projects.map(p => p._id === updated._id ? updated : p))}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────────────────────────────────────── */
function AdsDashboard({ projects, loading, error, targetAudiences, onOpen, onDelete }) {
  if (loading) {
    return <div className="glass-panel" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading ad projects...</div>;
  }
  if (error) {
    return <div className="glass-panel" style={{ textAlign: 'center', color: '#fca5a5' }}>⚠️ {error}</div>;
  }
  if (projects.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>No ad projects yet. Click "+ New Ad Project" to write your first Meta ad script.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.2rem' }}>
      {projects.map(p => {
        const audience = targetAudiences.find(a => a.id === p.audienceId);
        const versionCount = p.scriptVersions?.length || 0;
        return (
          <div key={p._id} className="glass-panel" style={{ margin: 0, padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{p.topic}</h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Audience: {audience?.name || 'Unassigned'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Status: {STAGE_LABELS[p.status] || p.status} · {versionCount} version{versionCount === 1 ? '' : 's'}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button className="btn" style={{ flex: 1, padding: '0.5rem 0.8rem' }} onClick={() => onOpen(p._id)}>Open</button>
              <button className="btn btn-secondary" style={{ padding: '0.5rem 0.8rem' }} onClick={() => onDelete(p._id)}>🗑</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   NEW PROJECT
───────────────────────────────────────────────────────────────────────── */
function AdsNewProject({ targetAudiences, activeAudience, onCreate }) {
  const [topic, setTopic] = useState('');
  const [audienceId, setAudienceId] = useState(activeAudience?.id || '');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!topic.trim() || !audienceId) return;
    setCreating(true);
    setError(null);
    try {
      await onCreate({ topic: topic.trim(), audienceId });
    } catch (e) {
      setError(e.message);
      setCreating(false);
    }
  };

  return (
    <div className="glass-panel">
      <h2 style={{ marginBottom: '0.3rem' }}>New Ad Project</h2>
      <p className="subtitle" style={{ marginBottom: '1.5rem' }}>Give the pipeline a topic/product and one target audience segment.</p>

      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Topic / Product</label>
      <input
        type="text"
        className="input-field"
        placeholder="e.g. Clip-on hair systems for active lifestyles"
        value={topic}
        onChange={e => setTopic(e.target.value)}
        style={{ marginBottom: '1.2rem' }}
      />

      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Target Audience Segment</label>
      {targetAudiences.length === 0 ? (
        <p style={{ color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
          No target audiences defined yet. Add one under 🎯 Target Audience in the Reel Engine first.
        </p>
      ) : (
        <select
          className="input-field"
          value={audienceId}
          onChange={e => setAudienceId(e.target.value)}
          style={{ marginBottom: '1.2rem' }}
        >
          <option value="">Select an audience...</option>
          {targetAudiences.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      )}

      {error && <p style={{ color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1rem' }}>⚠️ {error}</p>}

      <button className="btn" disabled={!topic.trim() || !audienceId || creating} onClick={handleSubmit}>
        {creating ? 'Creating...' : 'Create Project'}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   WORKSPACE — Angle -> Script -> Audit
───────────────────────────────────────────────────────────────────────── */
function AdsWorkspace({ project: initialProject, targetAudiences, onBack, onProjectUpdated }) {
  const [project, setProject] = useState(initialProject);
  const [selectedAngleId, setSelectedAngleId] = useState(null);
  const [draftScript, setDraftScript] = useState(null);
  const [auditResult, setAuditResult] = useState(null);

  const [angleFeedback, setAngleFeedback] = useState('');
  const [scriptFeedback, setScriptFeedback] = useState('');

  const [runningStage, setRunningStage] = useState(null); // 'angle' | 'script' | 'audit' | null
  const [errorMsg, setErrorMsg] = useState(null);

  const audience = targetAudiences.find(a => a.id === project.audienceId);
  const selectedAngle = (project.angleOptions || []).find(a => a.id === selectedAngleId);

  const refreshProject = async () => {
    const res = await fetch(`${API_URL}/ads/projects/${project._id}`);
    if (!res.ok) throw new Error('Failed to refresh project');
    const data = await res.json();
    setProject(data);
    onProjectUpdated(data);
    return data;
  };

  const runStage = async (key, body) => {
    setRunningStage(key);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_URL}/ads/projects/${project._id}/agents/${key}/run`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Agent run failed (${key})`);
      return data;
    } finally {
      setRunningStage(null);
    }
  };

  const handleGenerateAngles = async () => {
    try {
      const result = await runStage('angle', { audience, feedback: angleFeedback || null });
      setAngleFeedback('');
      setSelectedAngleId(null);
      setDraftScript(null);
      setAuditResult(null);
      await refreshProject();
    } catch (e) {
      setErrorMsg(e.message);
    }
  };

  const handleGenerateScript = async () => {
    if (!selectedAngle) return;
    try {
      const result = await runStage('script', { audience, angle: selectedAngle, feedback: scriptFeedback || null });
      setDraftScript(result.output);
      setAuditResult(null);
      setScriptFeedback('');
    } catch (e) {
      setErrorMsg(e.message);
    }
  };

  const handleAudit = async () => {
    if (!selectedAngle || !draftScript) return;
    try {
      const result = await runStage('audit', { audience, angle: selectedAngle, draftScript });
      setAuditResult(result.output);
      await refreshProject();
    } catch (e) {
      setErrorMsg(e.message);
    }
  };

  const versions = [...(project.scriptVersions || [])].sort((a, b) => b.version - a.version);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>{project.topic}</h2>
          <p className="subtitle" style={{ margin: 0 }}>Audience: {audience?.name || 'Unassigned'}</p>
        </div>
        <button className="btn btn-secondary" onClick={onBack}>← Back to Projects</button>
      </div>

      {errorMsg && (
        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '12px', padding: '0.9rem 1.2rem', marginBottom: '1.5rem', color: '#fca5a5' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* STAGE 1: AD ANGLES */}
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>1. Ad Angle Agent</h3>
          <button className="btn" disabled={runningStage !== null} onClick={handleGenerateAngles}>
            {runningStage === 'angle' ? 'Generating...' : (project.angleOptions?.length ? 'Regenerate Angles' : 'Generate Angles')}
          </button>
        </div>

        {(project.angleOptions?.length || 0) === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No angles generated yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {project.angleOptions.map(angle => {
              const isSelected = selectedAngleId === angle.id;
              return (
                <div
                  key={angle.id}
                  onClick={() => { setSelectedAngleId(angle.id); setDraftScript(null); setAuditResult(null); }}
                  style={{
                    cursor: 'pointer', borderRadius: '10px', padding: '1rem',
                    background: isSelected ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                    border: isSelected ? '1px solid #10b981' : '1px solid var(--panel-border)'
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>{angle.angleTitle}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>"{angle.hookLine}"</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {angle.awarenessStage} · Pain point: {angle.audiencePainPoint}
                  </div>
                  {isSelected && <div style={{ marginTop: '0.5rem', color: '#6ee7b7', fontSize: '0.8rem' }}>🟢 Selected</div>}
                </div>
              );
            })}
          </div>
        )}

        <textarea
          className="input-field"
          placeholder="Feedback for regeneration (optional)"
          value={angleFeedback}
          onChange={e => setAngleFeedback(e.target.value)}
          style={{ minHeight: '60px', resize: 'vertical' }}
        />
      </div>

      {/* STAGE 2: SCRIPT WRITER */}
      <div className="glass-panel" style={{ opacity: selectedAngle ? 1 : 0.5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>2. Script Writer Agent</h3>
          <button className="btn" disabled={!selectedAngle || runningStage !== null} onClick={handleGenerateScript}>
            {runningStage === 'script' ? 'Writing...' : (draftScript ? 'Regenerate Draft' : 'Generate Script')}
          </button>
        </div>

        {!selectedAngle ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Select an ad angle above first.</p>
        ) : !draftScript ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No draft generated yet for "{selectedAngle.angleTitle}".</p>
        ) : (
          <>
            <div className="script-output" style={{ marginBottom: '1rem' }}>{draftScript.fullScript}</div>
            <textarea
              className="input-field"
              placeholder="Feedback for a revised draft (optional)"
              value={scriptFeedback}
              onChange={e => setScriptFeedback(e.target.value)}
              style={{ minHeight: '60px', resize: 'vertical' }}
            />
          </>
        )}
      </div>

      {/* STAGE 3: AUDIT & FINALIZE */}
      <div className="glass-panel" style={{ opacity: draftScript ? 1 : 0.5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>3. Audit Agent</h3>
          <button className="btn" disabled={!draftScript || runningStage !== null} onClick={handleAudit}>
            {runningStage === 'audit' ? 'Auditing...' : 'Audit & Save Version'}
          </button>
        </div>

        {!draftScript ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Generate a draft script first.</p>
        ) : !auditResult ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Not audited yet.</p>
        ) : (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Audit Notes</div>
              <ul style={{ paddingLeft: '1.2rem', color: '#e4e4e7', fontSize: '0.85rem' }}>
                {auditResult.auditNotes.map((note, i) => <li key={i} style={{ marginBottom: '0.3rem' }}>{note}</li>)}
              </ul>
            </div>
            <div className="script-output">{auditResult.finalScript.fullScript}</div>
          </>
        )}
      </div>

      {/* VERSION HISTORY */}
      {versions.length > 0 && (
        <div className="glass-panel">
          <h3 style={{ marginBottom: '1rem' }}>Saved Versions ({versions.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {versions.map(v => (
              <details key={v.version} style={{ border: '1px solid var(--panel-border)', borderRadius: '10px', padding: '1rem' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                  v{v.version} — {v.angleUsed?.angleTitle || 'Untitled angle'} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({new Date(v.createdAt).toLocaleString()})</span>
                </summary>
                <div className="script-output" style={{ marginTop: '1rem' }}>{v.script?.fullScript}</div>
                {v.auditNotes?.length > 0 && (
                  <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
                    {v.auditNotes.map((note, i) => <li key={i}>{note}</li>)}
                  </ul>
                )}
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
