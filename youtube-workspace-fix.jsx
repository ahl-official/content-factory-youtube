function YoutubeWorkspace({ project, onBack }) {
    const [fullProject, setFullProject] = useState(null);
    const [activeAgentId, setActiveAgentId] = useState(project.activeAgent || 1);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [sirFeedbackText, setSirFeedbackText] = useState('');

    // Data State
    const [runs, setRuns] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    // Selected Angle (Agent 2)
    const [selectedAngleId, setSelectedAngleId] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    const AGENT_KEY_MAP = {
        1: 'research', 2: 'content_angle', 3: 'strategist', 4: 'structure', 5: 'script'
    };

    const fetchWorkspaceData = async () => {
        if (!project.backendId) return;
        try {
            const pRes = await fetch(`${API_URL}/yt/projects/${project.backendId}`);
            if (!pRes.ok) throw new Error("Failed to load project");
            const pData = await pRes.json();
            setFullProject(pData);

            // Auto sync active agent from backend if it moved forward
            setActiveAgentId(prev => Math.max(prev, parseInt(pData.CurrentAgent) || 1));

            const rRes = await fetch(`${API_URL}/yt/projects/${project.backendId}/agent-runs`);
            if (rRes.ok) setRuns(await rRes.json());
            const fRes = await fetch(`${API_URL}/yt/projects/${project.backendId}/feedback`);
            if (fRes.ok) setFeedbacks(await fRes.json());

        } catch (e) {
            console.error('Fetch err', e);
            setErrorMsg(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkspaceData();
    }, [project.backendId]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flex: 1 }}>
                <div style={{ color: '#a1a1aa' }}>Loading project workspace...</div>
            </div>
        );
    }

    if (!fullProject) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flex: 1, flexDirection: 'column', gap: '1rem' }}>
                <div style={{ color: '#ef4444' }}>Unable to load project.</div>
                <button className="yt-btn-secondary" onClick={onBack}>← Back to Projects</button>
            </div>
        );
    }

    const activeAgentKey = AGENT_KEY_MAP[activeAgentId];
    const activeAgent = YT_AGENTS.find(a => a.id === activeAgentId);

    // Filter runs for current agent
    const currentAgentRuns = runs.filter(r => r.AgentKey === activeAgentKey).sort((a, b) => b.Version - a.Version);
    const latestRun = currentAgentRuns[0];
    const isApproved = latestRun?.IsApproved === true || String(latestRun?.IsApproved) === 'true';

    // Sir check
    const sirFeedbacks = feedbacks.filter(f => f.Stage === activeAgentKey && f.IsSirFeedback && String(f.IsSirFeedback) === 'true').sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
    const latestSirFeedback = sirFeedbacks[0];

    // UI states
    const needsGeneration = currentAgentRuns.length === 0;

    let cpStatus = 'Not Requested';
    if (activeAgent?.hasSir) {
        if (fullProject.CurrentStage?.includes('Waiting for Sir')) cpStatus = 'Waiting for Sir';
        else if (fullProject.CurrentStage?.includes('Feedback Received')) cpStatus = 'Feedback Received';
        else if (isApproved) cpStatus = 'Approved';
        else if (latestRun) cpStatus = 'Ready to Request';
    } else {
        if (isApproved) cpStatus = 'Approved';
    }

    let nextActionText = "Review the selected agent output and send it to Sir.";
    if (needsGeneration) nextActionText = "Generate the initial output for this stage.";
    else if (cpStatus === 'Waiting for Sir') nextActionText = "Waiting for Sir's approval on the selected content.";
    else if (cpStatus === 'Feedback Received') nextActionText = "Sir has responded. Review his feedback before continuing.";
    else if (!isApproved && !activeAgent?.hasSir) nextActionText = "Review the output and approve to continue.";
    else if (isApproved) nextActionText = "Approved! Move to the next stage.";

    // Determine specific inputs to show based on agent
    const renderInputs = () => {
        return (
            <div style={{ fontSize: '0.85rem', color: '#e4e4e7', display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: '0.5rem', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                <div><span style={{ color: '#a1a1aa' }}>Topic:</span> {fullProject.WorkingTitle || 'Not provided'}</div>
                <div><span style={{ color: '#a1a1aa' }}>Source Type:</span> {fullProject.SourceType || 'Not provided'}</div>
                <div><span style={{ color: '#a1a1aa' }}>Target Audience:</span> {fullProject.TargetAudience || 'Not provided'}</div>
                <div><span style={{ color: '#a1a1aa' }}>Business Objective:</span> {fullProject.BusinessObjective || 'Not provided'}</div>
                <div><span style={{ color: '#a1a1aa' }}>Strategy Preference:</span> {fullProject.Strategy || 'Not provided'}</div>
                <div><span style={{ color: '#a1a1aa' }}>Content Type:</span> {fullProject.ContentType || 'Not provided'}</div>

                {fullProject.Notes && <div><span style={{ color: '#a1a1aa' }}>Notes:</span> {fullProject.Notes}</div>}

                {/* Source Specifics */}
                {fullProject.SourceType === 'Consultation' && (
                    <>
                        {fullProject.consultationTranscript && <div><span style={{ color: '#a1a1aa' }}>Consultation Transcript:</span> Active</div>}
                        {fullProject.consultationContext && <div><span style={{ color: '#a1a1aa' }}>Client Context:</span> Active</div>}
                        {fullProject.consultationTurningPoint && <div><span style={{ color: '#a1a1aa' }}>Key Concern / Turning Point:</span> Active</div>}
                    </>
                )}
                {fullProject.SourceType === 'Transformation' && (
                    <>
                        {fullProject.transformationBefore && <div><span style={{ color: '#a1a1aa' }}>Before:</span> Active</div>}
                        {fullProject.transformationChanged && <div><span style={{ color: '#a1a1aa' }}>What Changed:</span> Active</div>}
                        {fullProject.transformationAfter && <div><span style={{ color: '#a1a1aa' }}>Outcome:</span> Active</div>}
                        {fullProject.transformationTurningPoint && <div><span style={{ color: '#a1a1aa' }}>Turning Point:</span> Active</div>}
                        {fullProject.transformationFocus && <div><span style={{ color: '#a1a1aa' }}>Focus:</span> Active</div>}
                    </>
                )}
                {fullProject.SourceType === 'Existing Reference' && (
                    <>
                        {fullProject.referenceUrl && <div><span style={{ color: '#a1a1aa' }}>Reference URL:</span> {fullProject.referenceUrl}</div>}
                        {fullProject.referenceLearnings && <div><span style={{ color: '#a1a1aa' }}>Learning Targets:</span> Active</div>}
                        {fullProject.referenceNotes && <div><span style={{ color: '#a1a1aa' }}>Reference Notes:</span> Active</div>}
                    </>
                )}
                {activeAgentId > 1 && <div><span style={{ color: '#a1a1aa' }}>Prior Output:</span> Approved Data Available</div>}
            </div>
        );
    };

    const handleGenerate = async (isRegeneration = false) => {
        setActionLoading(true);
        setErrorMsg(null);
        try {
            const payload = {
                feedback: isRegeneration ? feedbackText : '',
                previousOutput: isRegeneration && latestRun ? JSON.parse(latestRun.OutputData) : null
            };

            if (activeAgentId >= 3) {
                const angleRun = runs.filter(r => r.AgentKey === 'content_angle' && String(r.IsApproved) === 'true')[0];
                if (angleRun) {
                    const adata = JSON.parse(angleRun.OutputData);
                    payload.selectedAngleData = adata.angles.find(a => a.id === selectedAngleId) || adata.angles[0];
                }
            }

            const r = await fetch(`${API_URL}/yt/projects/${fullProject.ProjectID}/agents/${activeAgentKey}/run`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.error);
            setFeedbackText('');
            setShowFeedback(false);
            fetchWorkspaceData();
        } catch (e) {
            setErrorMsg(e.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!latestRun) return;
        setActionLoading(true);
        try {
            await fetch(`${API_URL}/yt/projects/${fullProject.ProjectID}/agents/${activeAgentKey}/approve`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ runId: latestRun.RunID })
            });
            fetchWorkspaceData();
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSirSubmit = async (isApproval) => {
        setActionLoading(true);
        try {
            await fetch(`${API_URL}/yt/projects/${fullProject.ProjectID}/sir-review`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stage: activeAgentKey, feedbackText: sirFeedbackText, isApproved: isApproval, version: latestRun?.Version })
            });
            setSirFeedbackText('');
            if (isApproval) await handleApprove();
            fetchWorkspaceData();
        } catch (e) { console.error(e); } finally { setActionLoading(false); }
    };

    const renderOutputData = (jsonData) => {
        if (!jsonData) return "No output data.";
        if (activeAgentId === 1) {
            return (
                <div>
                    <h4>{jsonData.topicSummary}</h4>
                    <p><b>Intent:</b> {jsonData.likelySearchIntent} | <b>Browse Potential:</b> {jsonData.likelyBrowsePotential}</p>
                    <b>Content Gaps:</b><ul>{jsonData.contentGaps?.map((g, i) => <li key={i}>{g}</li>)}</ul>
                    <b>Angle Recommendation:</b> {jsonData.recommendedResearchAngle}
                </div>
            );
        }
        if (activeAgentId === 2) {
            return (
                <div>
                    <b>Recommended Angle IDs:</b> {jsonData.recommendedAngles?.join(', ')}<br /><br />
                    {jsonData.angles && jsonData.angles.map(a => (
                        <div key={a.id} style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem', marginBottom: '0.8rem', borderRadius: '4px', cursor: 'pointer', background: selectedAngleId === a.id ? 'rgba(129, 140, 248, 0.2)' : 'transparent' }} onClick={() => setSelectedAngleId(a.id)}>
                            <div style={{ color: '#818cf8', fontWeight: 600 }}>[{a.approach}] {a.title} {selectedAngleId === a.id ? '✓ (Selected)' : ''}</div>
                            <div style={{ fontSize: '0.8rem', marginTop: '0.4rem' }}>{a.description}</div>
                        </div>
                    ))}
                </div>
            );
        }
        if (activeAgentId === 5) {
            return <div style={{ whiteSpace: 'pre-wrap' }}>{jsonData.fullScript}</div>;
        }
        return <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowX: 'hidden' }}>{JSON.stringify(jsonData, null, 2)}</pre>;
    };

    const progressPct = Math.round(((parseInt(fullProject.Progress) || 0) / 15) * 100);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, overflow: 'hidden' }}>

            <div style={{ marginBottom: '1rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}>← Back to Projects</button>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#e4e4e7', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                {fullProject.WorkingTitle || 'Untitled Project'}
                            </h3>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                                {fullProject.ProjectID} • {fullProject.Strategy || 'No Strategy'} • {fullProject.ContentType || 'No Type'} • <span style={{ color: '#fbbf24' }}>{fullProject.CurrentStage || fullProject.Status}</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ width: '200px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                            <span>Progress:</span><span>{fullProject.Progress || 0} of 15 completed</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${progressPct}%`, background: '#818cf8', height: '100%' }}></div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', fontSize: '0.75rem', color: '#a1a1aa', gap: '2rem', marginBottom: '1rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}>
                    {AGENT_GROUPS.map((grp) => (
                        <div key={grp} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: activeAgent?.group === grp ? '#fff' : 'inherit' }}>
                            {activeAgent?.group === grp ? <span style={{ padding: '0.3rem 0.8rem', background: 'rgba(139,92,246,0.8)', color: '#fff', borderRadius: '12px', fontWeight: 600 }}>{grp}</span> : <><span>○</span> {grp}</>}
                        </div>
                    ))}
                </div>
            </div>

            <div className="yt-workspace-container">
                <div className="glass-panel yt-custom-scrollbar" style={{ flex: '0 0 240px', padding: '1.2rem 1rem', overflowY: 'auto' }}>
                    <div style={{ fontSize: '0.75rem', color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '1px' }}>WORKFLOW</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {AGENT_GROUPS.map(group => (
                            <div key={group} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{group.toUpperCase()}</div>
                                {YT_AGENTS.filter(a => a.group === group).map(a => {
                                    const isSelected = a.id === activeAgentId;
                                    const isCompleted = parseInt(fullProject.Progress) >= a.id;
                                    const isLocked = a.id > 5;
                                    const canAccess = a.id <= 5 && a.id <= (parseInt(fullProject.Progress) || 0) + 1;

                                    return (
                                        <div key={a.id} onClick={() => canAccess && setActiveAgentId(a.id)} style={{ padding: '0.3rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: canAccess ? 'pointer' : 'not-allowed', color: isCompleted ? '#34d399' : (isSelected ? '#fff' : 'var(--text-muted)'), opacity: isLocked ? 0.3 : 1 }}>
                                            <span>{isCompleted ? '✓' : (isSelected ? '●' : '○')}</span>
                                            <span style={{ fontWeight: isSelected ? 600 : 400 }}>{a.name} {isLocked ? '(Phase 4)' : ''}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-panel" style={{ flex: 'minmax(0, 1fr)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '0.8rem 1.2rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>NEXT ACTION</div><div style={{ fontSize: '0.85rem', color: '#e4e4e7' }}>{nextActionText}</div></div>
                    </div>

                    <div className="yt-custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div>
                                <h2 style={{ margin: '0 0 0.3rem 0', fontSize: '1.3rem', color: '#fff' }}>{activeAgent?.name}</h2>
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{activeAgent?.mission}</p>
                            </div>
                            {latestRun && <div style={{ background: 'rgba(168,85,247,0.15)', color: '#d8b4fe', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem' }}>V{latestRun.Version} • {isApproved ? 'Approved' : 'Current'}</div>}
                        </div>

                        {errorMsg && <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', marginBottom: '1rem', borderRadius: '6px' }}>{errorMsg}</div>}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.8rem' }}>INPUTS</div>{renderInputs()}</div>

                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.8rem' }}>OUTPUT</div>
                                {needsGeneration ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                        <button className="yt-btn-primary" onClick={() => handleGenerate(false)} disabled={actionLoading}>{actionLoading ? 'Generating...' : `Generate ${activeAgent?.name}`}</button>
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#e4e4e7', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        {latestRun && renderOutputData(JSON.parse(latestRun.OutputData))}
                                    </div>
                                )}
                            </div>

                            {currentAgentRuns.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.8rem' }}>VERSIONS</div>
                                    <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        {currentAgentRuns.map(r => (
                                            <div key={r.RunID} style={{ display: 'flex', justifyContent: 'space-between', color: '#e4e4e7' }}>
                                                <div><span style={{ color: '#818cf8', marginRight: '1rem' }}>V{r.Version}</span> {r.Status} {String(r.IsApproved) === 'true' && '(Approved)'}</div>
                                                <div style={{ color: 'var(--text-muted)' }}>{new Date(r.CreatedAt).toLocaleTimeString()}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {currentAgentRuns.length > 0 && !isApproved && (
                        <>
                            <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.1)', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                <button className="yt-btn-secondary" onClick={() => setShowFeedback(!showFeedback)}>Regenerate via AI Feedback</button>
                                <button className="yt-btn-success" style={{ marginLeft: 'auto' }} onClick={handleApprove} disabled={actionLoading || (activeAgentId === 2 && !selectedAngleId)}>{actionLoading ? 'Approving...' : (activeAgentId === 2 && !selectedAngleId ? 'Select an Angle to Approve' : activeAgent?.actionText)}</button>
                            </div>

                            {showFeedback && (
                                <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <textarea className="input-field" rows="2" placeholder="Tell the AI what to change..." value={feedbackText} onChange={e => setFeedbackText(e.target.value)} style={{ width: '100%', marginBottom: '0.5rem' }} />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button className="yt-btn-secondary" onClick={() => setShowFeedback(false)}>Cancel</button>
                                        <button className="yt-btn-primary" onClick={() => handleGenerate(true)} disabled={actionLoading}>{actionLoading ? 'Generating...' : 'Generate New Version'}</button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="glass-panel yt-custom-scrollbar" style={{ flex: '0 0 280px', padding: '1.2rem 1rem', overflowY: 'auto' }}>
                    {activeAgent?.hasSir ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: '0.85rem', color: '#e4e4e7', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '1px' }}>SIR'S REVIEW</div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                <button className="yt-btn-secondary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }} onClick={async () => { await fetch(`${API_URL}/yt/projects/${fullProject.ProjectID}/sir-review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage: activeAgentKey, isApproved: false }) }); fetchWorkspaceData(); }}>Notify Sir</button>
                                <button className="yt-btn-secondary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }}>Copy Brief</button>
                            </div>

                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>LATEST FEEDBACK</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{latestSirFeedback ? latestSirFeedback.FeedbackText : 'No feedback yet.'}</div>

                            <textarea className="input-field" rows="3" placeholder="Paste Sir's feedback..." value={sirFeedbackText} onChange={e => setSirFeedbackText(e.target.value)} style={{ width: '100%', marginBottom: '0.5rem', fontSize: '0.8rem' }} />
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.8rem', textAlign: 'center', opacity: 0.5 }}>🎙️ Voice Note placeholder</div>

                            <button className="yt-btn-primary" style={{ width: '100%', marginBottom: '0.5rem' }} onClick={() => handleSirSubmit(false)} disabled={actionLoading}>Apply Feedback (Reject)</button>
                            <button className="yt-btn-success" style={{ width: '100%' }} onClick={() => handleSirSubmit(true)} disabled={actionLoading}>Approve (Sir Approved)</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: '0.85rem', color: '#e4e4e7', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '1px' }}>PROJECT CONTEXT</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
                                <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Topic</div><div style={{ color: '#e4e4e7' }}>{fullProject.WorkingTitle || 'Not provided'}</div></div>
                                <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Source Type</div><div style={{ color: '#e4e4e7' }}>{fullProject.SourceType || 'Not provided'}</div></div>
                                <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Target Audience</div><div style={{ color: '#e4e4e7' }}>{fullProject.TargetAudience || 'Not provided'}</div></div>
                                <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Business Objective</div><div style={{ color: '#e4e4e7' }}>{fullProject.BusinessObjective || 'Not provided'}</div></div>
                                <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Strategy</div><div style={{ color: '#e4e4e7' }}>{fullProject.Strategy || 'Not provided'}</div></div>
                                <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Content Type</div><div style={{ color: '#e4e4e7' }}>{fullProject.ContentType || 'Not provided'}</div></div>
                                {fullProject.Notes && <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Notes</div><div style={{ color: '#e4e4e7' }}>{fullProject.Notes}</div></div>}

                                {/* Source Specific Contexts */}
                                {fullProject.SourceType === 'Consultation' && (
                                    <>
                                        {fullProject.consultationTranscript && <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Consultation Transcript</div><div style={{ color: '#e4e4e7' }}>{fullProject.consultationTranscript}</div></div>}
                                        {fullProject.consultationContext && <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Client Context</div><div style={{ color: '#e4e4e7' }}>{fullProject.consultationContext}</div></div>}
                                        {fullProject.consultationTurningPoint && <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Turning Point</div><div style={{ color: '#e4e4e7' }}>{fullProject.consultationTurningPoint}</div></div>}
                                    </>
                                )}
                                {fullProject.SourceType === 'Transformation' && (
                                    <>
                                        {fullProject.transformationBefore && <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Before</div><div style={{ color: '#e4e4e7' }}>{fullProject.transformationBefore}</div></div>}
                                        {fullProject.transformationChanged && <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>What Changed</div><div style={{ color: '#e4e4e7' }}>{fullProject.transformationChanged}</div></div>}
                                        {fullProject.transformationAfter && <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Outcome</div><div style={{ color: '#e4e4e7' }}>{fullProject.transformationAfter}</div></div>}
                                        {fullProject.transformationTurningPoint && <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Turning Point</div><div style={{ color: '#e4e4e7' }}>{fullProject.transformationTurningPoint}</div></div>}
                                        {fullProject.transformationFocus && <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Focus</div><div style={{ color: '#e4e4e7' }}>{fullProject.transformationFocus}</div></div>}
                                    </>
                                )}
                                {fullProject.SourceType === 'Existing Reference' && (
                                    <>
                                        {fullProject.referenceUrl && <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Reference URL</div><div style={{ color: '#e4e4e7' }}>{fullProject.referenceUrl}</div></div>}
                                        {fullProject.referenceLearnings && <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Learning Targets</div><div style={{ color: '#e4e4e7' }}>{fullProject.referenceLearnings}</div></div>}
                                        {fullProject.referenceNotes && <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Reference Notes</div><div style={{ color: '#e4e4e7' }}>{fullProject.referenceNotes}</div></div>}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
