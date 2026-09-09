import { useState, useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api');

const STAGE_LABELS = {
  draft: 'Draft',
  angles_generated: 'Angles Ready',
  script_ready: 'Script Ready ✓'
};

const STEPS = [
  { key: 'angle', label: 'Ad Angle' },
  { key: 'script', label: 'Script Writer' },
  { key: 'audit', label: 'Audit & Finalize' }
];

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
   SHARED BITS — copy button, spinner hint
───────────────────────────────────────────────────────────────────────── */
function legacyCopy(text) {
  // Fallback for when the async Clipboard API is unavailable or its permission is denied
  // (both real cases, not just headless browsers) — execCommand uses a different, older
  // permission model that often still works from a direct click handler.
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let succeeded = false;
  try {
    succeeded = document.execCommand('copy');
  } catch (e) {
    succeeded = false;
  }
  document.body.removeChild(textarea);
  return succeeded;
}

function CopyButton({ text, label = 'Copy Script' }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'copied' | 'failed'
  const handleCopy = async () => {
    let succeeded = false;
    try {
      await navigator.clipboard.writeText(text || '');
      succeeded = true;
    } catch (e) {
      succeeded = legacyCopy(text || '');
    }
    setStatus(succeeded ? 'copied' : 'failed');
    setTimeout(() => setStatus('idle'), 1800);
  };
  const label2 = status === 'copied' ? '✓ Copied' : status === 'failed' ? '⚠️ Copy failed — select manually' : `📋 ${label}`;
  return (
    <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={handleCopy}>
      {label2}
    </button>
  );
}

function GeneratingHint({ show, text = 'This can take up to ~30 seconds...' }) {
  if (!show) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.6rem' }}>
      <div className="loader" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
      {text}
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
        const versions = p.scriptVersions || [];
        const latestVersion = versions.length ? versions.reduce((a, b) => (a.version > b.version ? a : b)) : null;
        return (
          <div key={p._id} className="glass-panel" style={{ margin: 0, padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{p.topic}</h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Audience: {audience?.name || 'Unassigned'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Status: {STAGE_LABELS[p.status] || p.status} · {versions.length} version{versions.length === 1 ? '' : 's'}
            </div>
            {latestVersion && (
              <div style={{
                fontSize: '0.78rem', color: '#a5b4fc', background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', padding: '0.5rem 0.7rem',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                📝 v{latestVersion.version}: "{latestVersion.script?.hook}"
              </div>
            )}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.2rem' }}>
          {targetAudiences.map(a => {
            const isSelected = audienceId === a.id;
            return (
              <div
                key={a.id}
                onClick={() => setAudienceId(a.id)}
                title={a.notes}
                style={{
                  cursor: 'pointer', borderRadius: '10px', padding: '0.9rem',
                  background: isSelected ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                  border: isSelected ? '1px solid #10b981' : '1px solid var(--panel-border)'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                  {isSelected ? '🟢 ' : ''}{a.name}
                </div>
                <div style={{
                  fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                }}>
                  {a.notes}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && <p style={{ color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1rem' }}>⚠️ {error}</p>}

      <button className="btn" disabled={!topic.trim() || !audienceId || creating} onClick={handleSubmit}>
        {creating ? 'Creating...' : 'Create Project'}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   STEPPER
───────────────────────────────────────────────────────────────────────── */
function Stepper({ activeStep, isDone, isReachable, onJump }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
      {STEPS.map((step, i) => {
        const active = step.key === activeStep;
        const done = isDone(step.key);
        const reachable = isReachable(step.key);
        const clickable = reachable && !active;
        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div
              onClick={() => clickable && onJump(step.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                cursor: clickable ? 'pointer' : 'default',
                opacity: reachable ? 1 : 0.4
              }}
            >
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700,
                background: active ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : done ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                border: active ? 'none' : done ? '1px solid #10b981' : '1px solid var(--panel-border)',
                color: active ? '#fff' : done ? '#6ee7b7' : 'var(--text-muted)'
              }}>
                {done && !active ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: active ? 600 : 400, color: active ? 'var(--text-main)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: '1px', background: done ? '#10b981' : 'var(--panel-border)', margin: '0 0.75rem', opacity: done ? 0.5 : 1 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CompletedStepSummary({ title, snippet, onEdit }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
      padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)',
      borderRadius: '10px', marginBottom: '0.75rem', fontSize: '0.85rem'
    }}>
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'baseline', minWidth: 0 }}>
        <span style={{ color: '#6ee7b7', flexShrink: 0 }}>✓</span>
        <span style={{ fontWeight: 600, flexShrink: 0 }}>{title}</span>
        {snippet && <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{snippet}</span>}
      </div>
      <button className="btn btn-secondary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem', flexShrink: 0 }} onClick={onEdit}>Edit</button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   VERSION HISTORY
───────────────────────────────────────────────────────────────────────── */
function VersionHistory({ versions }) {
  const [expanded, setExpanded] = useState(() => new Set(versions.length ? [versions[0].version] : []));
  const toggle = (v) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(v)) next.delete(v); else next.add(v);
    return next;
  });

  return (
    <div className="glass-panel">
      <h3 style={{ marginBottom: '1rem' }}>Saved Versions ({versions.length})</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {versions.map(v => {
          const isOpen = expanded.has(v.version);
          return (
            <div key={v.version} style={{ border: '1px solid var(--panel-border)', borderRadius: '10px', overflow: 'hidden' }}>
              <button
                onClick={() => toggle(v.version)}
                style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.9rem 1rem', background: 'rgba(255,255,255,0.02)', border: 'none',
                  color: 'var(--text-main)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', textAlign: 'left'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 600, minWidth: 0 }}>
                  <span style={{ display: 'inline-block', transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}>▸</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    v{v.version} — {v.angleUsed?.angleTitle || 'Untitled angle'}
                  </span>
                </span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem', flexShrink: 0, marginLeft: '1rem' }}>
                  {new Date(v.createdAt).toLocaleString()}
                </span>
              </button>
              {isOpen && (
                <div style={{ padding: '0 1rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                    <CopyButton text={v.script?.fullScript} />
                  </div>
                  <div className="script-output">{v.script?.fullScript}</div>
                  {v.auditNotes?.length > 0 && (
                    <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
                      {v.auditNotes.map((note, i) => <li key={i}>{note}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   WORKSPACE — Angle -> Script -> Audit
───────────────────────────────────────────────────────────────────────── */
function AdsWorkspace({ project: initialProject, targetAudiences, onBack, onProjectUpdated }) {
  const [project, setProject] = useState(initialProject);
  const [activeStep, setActiveStep] = useState('angle');
  const [selectedAngleId, setSelectedAngleId] = useState(null);
  const [draftScript, setDraftScript] = useState(null);
  const [auditResult, setAuditResult] = useState(null);

  const [angleFeedback, setAngleFeedback] = useState('');
  const [scriptFeedback, setScriptFeedback] = useState('');

  const [runningStage, setRunningStage] = useState(null); // 'angle' | 'script' | 'audit' | null
  const [errorMsg, setErrorMsg] = useState(null);

  const activePanelRef = useRef(null);
  useEffect(() => {
    activePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeStep]);

  const audience = targetAudiences.find(a => a.id === project.audienceId);
  const selectedAngle = (project.angleOptions || []).find(a => a.id === selectedAngleId);

  const isDone = (key) => {
    if (key === 'angle') return (project.angleOptions?.length || 0) > 0;
    if (key === 'script') return !!draftScript;
    if (key === 'audit') return !!auditResult;
    return false;
  };
  const isReachable = (key) => {
    if (key === 'angle') return true;
    if (key === 'script') return !!selectedAngle;
    if (key === 'audit') return !!draftScript;
    return false;
  };

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

  const handleSelectAngle = (angleId) => {
    if (angleId !== selectedAngleId) {
      setSelectedAngleId(angleId);
      setDraftScript(null);
      setAuditResult(null);
    }
    setActiveStep('script');
  };

  const handleGenerateAngles = async () => {
    try {
      await runStage('angle', { audience, feedback: angleFeedback || null });
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
      setActiveStep('audit');
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

  const handleWriteAnother = () => {
    setSelectedAngleId(null);
    setDraftScript(null);
    setAuditResult(null);
    setActiveStep('angle');
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

      <Stepper activeStep={activeStep} isDone={isDone} isReachable={isReachable} onJump={setActiveStep} />

      <div ref={activePanelRef}>
        {/* Completed-step summaries above the active panel */}
        {activeStep !== 'angle' && selectedAngle && (
          <CompletedStepSummary
            title={selectedAngle.angleTitle}
            snippet={`"${selectedAngle.hookLine}"`}
            onEdit={() => setActiveStep('angle')}
          />
        )}
        {activeStep === 'audit' && draftScript && (
          <CompletedStepSummary
            title="Draft script written"
            snippet={draftScript.hook}
            onEdit={() => setActiveStep('script')}
          />
        )}

        {/* STAGE 1: AD ANGLES */}
        {activeStep === 'angle' && (
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h3 style={{ margin: 0 }}>1. Ad Angle Agent</h3>
              <button className="btn" disabled={runningStage !== null} onClick={handleGenerateAngles}>
                {runningStage === 'angle' ? 'Generating...' : (project.angleOptions?.length ? 'Regenerate Angles' : 'Generate Angles')}
              </button>
            </div>
            <GeneratingHint show={runningStage === 'angle'} />

            {(project.angleOptions?.length || 0) === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: runningStage === 'angle' ? '0.75rem' : 0 }}>No angles generated yet.</p>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', margin: '1rem 0' }}>
                  {project.angleOptions.map(angle => {
                    const isSelected = selectedAngleId === angle.id;
                    return (
                      <div
                        key={angle.id}
                        onClick={() => handleSelectAngle(angle.id)}
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
                <textarea
                  className="input-field"
                  placeholder="Feedback for regeneration (optional)"
                  value={angleFeedback}
                  onChange={e => setAngleFeedback(e.target.value)}
                  style={{ minHeight: '60px', resize: 'vertical' }}
                />
              </>
            )}
          </div>
        )}

        {/* STAGE 2: SCRIPT WRITER */}
        {activeStep === 'script' && selectedAngle && (
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h3 style={{ margin: 0 }}>2. Script Writer Agent</h3>
              <button className="btn" disabled={runningStage !== null} onClick={handleGenerateScript}>
                {runningStage === 'script' ? 'Writing...' : (draftScript ? 'Regenerate Draft' : 'Generate Script')}
              </button>
            </div>
            <GeneratingHint show={runningStage === 'script'} />

            {!draftScript ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: runningStage === 'script' ? '0.75rem' : 0 }}>
                No draft generated yet for "{selectedAngle.angleTitle}".
              </p>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '1rem 0 0.5rem' }}>
                  <CopyButton text={draftScript.fullScript} />
                </div>
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
        )}

        {/* STAGE 3: AUDIT & FINALIZE */}
        {activeStep === 'audit' && draftScript && (
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h3 style={{ margin: 0 }}>3. Audit Agent</h3>
              <button className="btn" disabled={!!auditResult || runningStage !== null} onClick={handleAudit}>
                {runningStage === 'audit' ? 'Auditing...' : auditResult ? 'Saved ✓' : 'Audit & Save Version'}
              </button>
            </div>
            <GeneratingHint show={runningStage === 'audit'} />

            {!auditResult ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: runningStage === 'audit' ? '0.75rem' : 0 }}>Not audited yet.</p>
            ) : (
              <>
                <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Audit Notes</div>
                  <ul style={{ paddingLeft: '1.2rem', color: '#e4e4e7', fontSize: '0.85rem' }}>
                    {auditResult.auditNotes.map((note, i) => <li key={i} style={{ marginBottom: '0.3rem' }}>{note}</li>)}
                  </ul>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: '0.6rem'
                }}>
                  <span style={{ color: '#6ee7b7', fontWeight: 600, fontSize: '0.85rem' }}>✅ Final Script — saved as new version</span>
                  <CopyButton text={auditResult.finalScript.fullScript} />
                </div>
                <div className="script-output" style={{ border: '1px solid #10b981' }}>{auditResult.finalScript.fullScript}</div>
                <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={handleWriteAnother}>
                  ✨ Write Another Version
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {versions.length > 0 && <VersionHistory versions={versions} />}
    </div>
  );
}
