import React, { useState, useEffect, useRef, Component } from 'react';
import { StyleGuideView, CreatorPlaybookView, TargetAudienceView, BrandVoicesView, ThumbnailStylesView, EditingStylesView, VideoFormatsView, HookLibraryView } from '../App';

// 15 Standard YouTube Agents
const YT_AGENTS = [
    { id: 1, group: 'Strategy', name: '1. Research Agent', mission: 'Find high-potential YouTube topics.', actionText: 'Approve Research → Continue' },
    { id: 2, group: 'Strategy', name: '2. Content Angle Generator', mission: 'Create unique, compelling angles that match audience intent and business goals.', actionText: 'Submit Selected to Sir', hasSir: true, sirTitle: 'Angle Approval' },
    { id: 3, group: 'Strategy', name: '3. YouTube Strategist', mission: 'Decide which video should be made.', actionText: 'Approve Strategy → Continue' },

    { id: 4, group: 'Story', name: '4. Video Structure Architect', mission: 'Design the entire retention structure.', actionText: 'Approve Structure → Continue', hasSir: true, sirTitle: 'Structure Approval' },
    { id: 5, group: 'Story', name: '5. Script Writer', mission: 'Write the full high-retention script.', actionText: 'Approve Script → Continue', hasSir: true, sirTitle: 'Script Approval' },

    { id: 6, group: 'Production', name: '6. Creative Director', mission: 'Visualize the video execution.', actionText: 'Approve Creative → Continue' },

    { id: 7, group: 'Packaging', name: '7. Thumbnail Strategist', mission: 'Maximize CTR.', actionText: 'Approve Strategy → Continue' },
    { id: 8, group: 'Packaging', name: '8. Thumbnail Designer', mission: 'Execute thumbnail directives.', actionText: 'Approve Thumbnails → Continue' },
    { id: 9, group: 'Packaging', name: '9. Title Strategist', mission: 'Generate high-performing titles.', actionText: 'Approve Titles → Continue' },
    { id: 10, group: 'Packaging', name: '10. SEO Agent', mission: 'Optimize metadata terms.', actionText: 'Approve SEO → Continue', hasSir: true, sirTitle: 'SEO Review', optionalSir: true },
    { id: 10.5, group: 'Packaging', name: '10.5. Metadata Agent', mission: 'Convert SEO into publish package.', actionText: 'Approve Output → Continue' },

    { id: 11, group: 'Review', name: '11. Video Editor', mission: 'Maximize retention during edit.', actionText: 'Approve Edit → Continue' },
    { id: 12, group: 'Review', name: '12. Retention Analyst', mission: 'Focus on viewer psychology.', actionText: 'Approve Analysis → Continue' },
    { id: 13, group: 'Review', name: '13. Brand Consistency Agent', mission: 'Ensure brand alignment.', actionText: 'Approve Brand Check → Continue' },
    { id: 14, group: 'Review', name: '14. Quality Control', mission: 'Final comprehensive review.', actionText: 'Approve QC → Continue', hasSir: true, sirTitle: 'Final Approval', optionalSir: true },

    { id: 15, group: 'Performance', name: '15. Analytics Agent', mission: 'Analyze performance.', actionText: 'Approve Insights → Complete Project' },
];

const AGENT_GROUPS = ['Strategy', 'Story', 'Production', 'Packaging', 'Review', 'Performance'];

const MOCK_PROJECTS = [
    {
        id: 1, title: 'Why Hair Transplants Look Thin After 5 Years', sourceType: 'Original Topic',
        status: 'Waiting for Sir', strategy: 'Search', contentType: 'Evergreen',
        activeAgent: 2, updatedAt: '10 mins ago', sirStatus: 'Waiting for Sir',
        targetAudience: 'Men & Women 25-45', businessObj: 'Education'
    },
    {
        id: 2, title: 'The Truth About Minoxidil Shedding', sourceType: 'Consultation',
        status: 'Script Review', strategy: 'Browse', contentType: 'Trending',
        activeAgent: 5, updatedAt: '2 hours ago', sirStatus: 'Waiting for Sir',
        targetAudience: 'Early thinning males', businessObj: 'Awareness'
    },
    {
        id: 3, title: 'Best Hair System for Active Lifestyle', sourceType: 'Original Topic',
        status: 'In Research', strategy: 'Search', contentType: 'Evergreen',
        activeAgent: 1, updatedAt: '3 hours ago', sirStatus: 'Not Requested',
        targetAudience: 'Athletes', businessObj: 'Leads'
    }
];

// REUSABLE CUSTOM DROPDOWN
function CustomSelect({ value, options, onChange, style }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    return (
        <div ref={dropdownRef} style={{ position: 'relative', width: '100%', ...style }}>
            <div
                className={`yt-custom-select ${isOpen ? 'focused' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                tabIndex={0}
            >
                <span style={{ color: value ? '#ffffff' : '#9ca3af' }}>{value || 'Select...'}</span>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isOpen && (
                <div className="yt-dropdown-menu yt-custom-scrollbar">
                    {options.map(opt => (
                        <div
                            key={opt}
                            className={`yt-dropdown-option ${value === opt ? 'selected' : ''}`}
                            onClick={() => { onChange(opt); setIsOpen(false); }}
                        >
                            <span>{opt}</span>
                            {value === opt && <span style={{ color: '#a855f7', fontSize: '1rem', marginLeft: 'auto' }}>✓</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api');

export default function YoutubeFactory() {
    const [view, setView] = useState('dashboard');
    const [projects, setProjects] = useState([]);
    const [activeProjectId, setActiveProjectId] = useState(null);

    // YT Isolated Manual Configurations & Autonomous Learnings
    const [sirStyleGuide, setSirStyleGuide] = useState('');
    const [creatorReferences, setCreatorReferences] = useState([]);
    const [activeCreatorId, setActiveCreatorId] = useState(null);
    const [targetAudiences, setTargetAudiences] = useState([]);
    const [activeAudienceId, setActiveAudienceId] = useState(null);
    const [brandVoices, setBrandVoices] = useState([]);
    const [activeBrandVoiceId, setActiveBrandVoiceId] = useState(null);
    const [thumbnailStyles, setThumbnailStyles] = useState([]);
    const [activeThumbnailStyleId, setActiveThumbnailStyleId] = useState(null);
    const [editingStyles, setEditingStyles] = useState([]);
    const [activeEditingStyleId, setActiveEditingStyleId] = useState(null);
    const [videoFormats, setVideoFormats] = useState([]);
    const [hookLibrary, setHookLibrary] = useState([]);

    const [isLoadingDB, setIsLoadingDB] = useState(true);
    const [dbLoadSuccess, setDbLoadSuccess] = useState(false);
    const [dbError, setDbError] = useState(null);

    // Load Youtube DB Settings
    useEffect(() => {
        fetch(`${API_URL}/yt/db/load`)
            .then(res => res.json())
            .then(data => {
                if (data.sirStyleGuide) setSirStyleGuide(data.sirStyleGuide);
                if (data.creatorReferences) setCreatorReferences(data.creatorReferences);
                if (data.targetAudiences) setTargetAudiences(data.targetAudiences);
                if (data.brandVoices) setBrandVoices(data.brandVoices);
                if (data.thumbnailStyles) setThumbnailStyles(data.thumbnailStyles);
                if (data.editingStyles) setEditingStyles(data.editingStyles);
                if (data.videoFormats) setVideoFormats(data.videoFormats);
                if (data.hookLibrary) setHookLibrary(data.hookLibrary);

                if (data.activeCreatorId !== undefined) setActiveCreatorId(data.activeCreatorId || 1);
                if (data.activeAudienceId !== undefined) setActiveAudienceId(data.activeAudienceId || 1);
                if (data.activeBrandVoiceId !== undefined) setActiveBrandVoiceId(data.activeBrandVoiceId || 1);
                if (data.activeThumbnailStyleId !== undefined) setActiveThumbnailStyleId(data.activeThumbnailStyleId || 1);
                if (data.activeEditingStyleId !== undefined) setActiveEditingStyleId(data.activeEditingStyleId || 1);

                setDbLoadSuccess(true);
            })
            .catch(e => {
                console.error("YT DB Load Error:", e);
                setDbError("Failed to connect to YouTube Google Sheets Database.");
            })
            .finally(() => setIsLoadingDB(false));
    }, []);

    // Save Youtube DB Sync
    useEffect(() => {
        if (isLoadingDB || !dbLoadSuccess) return;
        const payload = {
            sirStyleGuide, creatorReferences, targetAudiences, hookLibrary, brandVoices,
            thumbnailStyles, editingStyles, videoFormats,
            activeCreatorId: activeCreatorId || '',
            activeAudienceId: activeAudienceId || '',
            activeBrandVoiceId: activeBrandVoiceId || '',
            activeThumbnailStyleId: activeThumbnailStyleId || '',
            activeEditingStyleId: activeEditingStyleId || ''
        };
        fetch(`${API_URL}/yt/db/save`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(e => console.error("YT DB Sync Error:", e));
    }, [sirStyleGuide, creatorReferences, targetAudiences, hookLibrary, brandVoices, thumbnailStyles, editingStyles, videoFormats, activeCreatorId, activeAudienceId, activeBrandVoiceId, activeThumbnailStyleId, activeEditingStyleId, isLoadingDB]);

    // Autonomous Learn From Feedback explicitly for YouTube Engine
    const learnFromFeedback = async ({ sirFeedback, scriptBefore, topic }) => {
        if (!sirFeedback?.trim()) return;
        try {
            const res = await fetch(`${API_URL}/learn`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentStyleGuide: sirStyleGuide, sirFeedback, scriptBefore, topic }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                setDbError(`Autonomous Engine Error: ${errData.error || res.statusText}. Check API quota.`);
                return;
            }

            const data = await res.json();
            if (data.isNewRule && data.updatedGuide) {
                setSirStyleGuide(data.updatedGuide);
            }
        } catch (e) {
            setDbError(`Autonomous Engine Network Error: ${e.message}`);
        }
    };

    const fetchProjects = () => {
        fetch(`${API_URL}/yt/projects`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setProjects(data.map(d => ({
                        id: parseInt(d.ProjectID.replace('YT-', ''), 10) || d.ProjectID,
                        projectId: d.ProjectID,
                        title: d.WorkingTitle || '',
                        sourceType: d.SourceType || '',
                        strategy: d.Strategy || '',
                        contentType: d.ContentType || '',
                        status: d.Status || 'In Research',
                        currentStage: d.CurrentStage || 'In Research',
                        currentAgent: parseFloat(d.CurrentAgent) || 1,
                        progress: parseFloat(d.Progress) || 0,
                        updatedAt: d.UpdatedAt ? new Date(d.UpdatedAt).toLocaleDateString() : 'Just now',
                        businessObj: d.BusinessObjective || '',
                        targetAudience: d.TargetAudience || ''
                    })));
                }
            })
            .catch(console.error);
    };

    useEffect(() => {
        fetchProjects();

        const style = document.createElement('style');
        style.innerHTML = `
      .yt-viewport-lock { height: calc(100vh - 65px); display: flex; flex-direction: column; overflow: hidden; margin-top: 0.5rem; }
      .yt-workspace-container { flex: 1; display: grid; grid-template-columns: 220px 660px 220px; justify-content: center; gap: 1rem; overflow: hidden; min-height: 0; }
      @media (max-width: 900px) {
         .yt-workspace-container { flex-direction: column; overflow-y: auto; height: auto; display: flex; }
         .yt-viewport-lock { height: auto; overflow: visible; }
      }
      .yt-custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .yt-custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .yt-custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; transition: background 0.2s; }
      .yt-custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }

      @keyframes spin { 100% { transform: rotate(360deg); } }
      .yt-spinner { display: inline-block; width: 1.2rem; height: 1.2rem; border: 2px solid rgba(168,85,247,0.3); border-radius: 50%; border-top-color: #a855f7; animation: spin 1s linear infinite; }
      
      @keyframes yt-drop-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      .yt-drop-in-anim { animation: yt-drop-in 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
      
      .yt-card-btn { padding: 0.5rem 0.8rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: var(--text-muted); cursor: pointer; text-align: center; font-size: 0.85rem; }
      .yt-card-btn.active { background: rgba(139,92,246,0.15); border-color: rgba(139,92,246,0.5); color: #fff; box-shadow: 0 0 15px rgba(168,85,247,0.25); }
      
      .yt-btn-primary { background: rgba(139, 92, 246, 0.9); color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
      .yt-btn-primary:hover:not(:disabled) { background: rgba(139, 92, 246, 1); box-shadow: 0 0 12px rgba(139,92,246,0.5); transform: translateY(-1px); }
      .yt-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
      
      .yt-btn-secondary { background: transparent; color: #d4d4d8; border: 1px solid rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
      .yt-btn-secondary:hover:not(:disabled) { background: rgba(255,255,255,0.1); box-shadow: 0 0 8px rgba(255,255,255,0.15); transform: translateY(-1px); }
      .yt-btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
      
      .yt-btn-success { background: #10b981; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
      .yt-btn-success:hover:not(:disabled) { background: #059669; box-shadow: 0 0 12px rgba(16,185,129,0.5); transform: translateY(-1px); }
      .yt-btn-success:disabled { opacity: 0.5; cursor: not-allowed; }
      
      .yt-btn-warning { background: transparent; color: #fbbf24; border: 1px solid #fbbf24; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
      .yt-btn-warning:hover:not(:disabled) { background: rgba(251,191,36,0.1); box-shadow: 0 0 8px rgba(251,191,36,0.25); transform: translateY(-1px); }
      .yt-btn-warning:disabled { opacity: 0.5; cursor: not-allowed; }


      /* REUSABLE CUSTOM DROPDOWN */
      .yt-custom-select {
        height: 44px; width: 100%; display: flex; align-items: center; justify-content: space-between;
        cursor: pointer; user-select: none; padding: 0 1rem; border-radius: 10px;
        background: #111827; border: 1px solid rgba(255,255,255,0.1);
        transition: all 0.2s;
      }
      .yt-custom-select.focused, .yt-custom-select:focus {
        border-color: rgba(124, 92, 255, 0.8);
        box-shadow: 0 0 0 1px rgba(124, 92, 255, 0.35), 0 0 12px rgba(124, 92, 255, 0.20);
        outline: none;
      }
      .yt-dropdown-menu {
        position: absolute; top: calc(100% + 6px); left: 0; right: 0;
        background: #111827; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 9999;
        max-height: 250px; overflow-y: auto; overflow-x: hidden; padding: 0.4rem 0;
      }
      .yt-dropdown-option {
        height: 42px; padding: 0 1rem; color: #e4e4e7; font-size: 0.85rem; cursor: pointer;
        display: flex; align-items: center; transition: background 0.2s; background: transparent;
      }
      .yt-dropdown-option:hover {
        background: rgba(124, 92, 255, 0.10); color: #fff;
      }
      .yt-dropdown-option.selected {
        background: rgba(124, 92, 255, 0.16); color: #fff;
      }
      .yt-file-card {
        display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(139, 92, 246, 0.3);
        border-radius: 12px;
        box-shadow: 0 0 10px rgba(139, 92, 246, 0.1);
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .yt-file-card:hover {
        border-color: rgba(139, 92, 246, 0.6);
        box-shadow: 0 0 12px rgba(139, 92, 246, 0.15);
      }
      .yt-btn-danger-ghost {
        background: transparent; border: none; color: #f87171; padding: 0.4rem 0.6rem; border-radius: 6px;
        cursor: pointer; transition: background 0.2s; font-size: 0.75rem;
      }
      .yt-btn-danger-ghost:hover {
        background: rgba(248, 113, 113, 0.1);
      }
      .yt-upload-zone {
        display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
        padding: 1.5rem; background: rgba(0,0,0,0.2); border: 1px dashed rgba(255,255,255,0.2); border-radius: 8px; cursor: pointer; transition: all 0.2s;
      }
      .yt-upload-zone:hover {
        border-color: rgba(139,92,246,0.6); background: rgba(255,255,255,0.02);
      }
    `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    useEffect(() => {
        if (view === 'dashboard') {
            fetchProjects();
        }
    }, [view]);

    const currentProject = projects.find(p => p.id === activeProjectId);

    return (
        <div className={view === 'workspace' ? 'yt-viewport-lock' : ''} style={view !== 'workspace' ? { display: 'flex', flexDirection: 'column', height: '100%', marginTop: '0.5rem' } : {}}>

            {view !== 'workspace' && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <h2 style={{ margin: '0 1rem 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>📺 YouTube Engine</h2>
                    <button className={view === 'dashboard' ? 'yt-btn-primary' : 'yt-btn-secondary'} onClick={() => setView('dashboard')}>Projects Dashboard</button>
                    <button className={view === 'new_project' ? 'yt-btn-primary' : 'yt-btn-secondary'} onClick={() => setView('new_project')}>+ New YouTube Video</button>
                    <button className={view === 'settings' ? 'yt-btn-primary' : 'yt-btn-secondary'} onClick={() => setView('settings')}>Auto-Learning Memory</button>

                    <div style={{ width: '100%', height: '10px' }}></div>

                    <button className={`btn ${view === 'guide' ? 'yt-btn-primary' : 'yt-btn-secondary'}`} onClick={() => setView('guide')}>🧠 Sir's Style Guide {sirStyleGuide ? '●' : ''}</button>
                    <button className={`btn ${view === 'creators' ? 'yt-btn-primary' : 'yt-btn-secondary'}`} onClick={() => setView('creators')}>🎬 Creator Playbook {activeCreatorId ? '●' : ''}</button>
                    <button className={`btn ${view === 'audiences' ? 'yt-btn-primary' : 'yt-btn-secondary'}`} onClick={() => setView('audiences')}>🎯 Target Audience {activeAudienceId ? '●' : ''}</button>
                    <button className={`btn ${view === 'brands' ? 'yt-btn-primary' : 'yt-btn-secondary'}`} onClick={() => setView('brands')}>👑 Brand Voices {activeBrandVoiceId ? '●' : ''}</button>
                    <button className={`btn ${view === 'thumbnails' ? 'yt-btn-primary' : 'yt-btn-secondary'}`} onClick={() => setView('thumbnails')}>🖼️ Thumbnail Styles {activeThumbnailStyleId ? '●' : ''}</button>
                    <button className={`btn ${view === 'editing' ? 'yt-btn-primary' : 'yt-btn-secondary'}`} onClick={() => setView('editing')}>✂️ Editing Styles {activeEditingStyleId ? '●' : ''}</button>
                    <button className={`btn ${view === 'formats' ? 'yt-btn-primary' : 'yt-btn-secondary'}`} onClick={() => setView('formats')}>🎬 Video Formats</button>
                    <button className={`btn ${view === 'hooks' ? 'yt-btn-primary' : 'yt-btn-secondary'}`} onClick={() => setView('hooks')}>🪝 Hook Library</button>

                </div>
            )}

            {view === 'dashboard' && <YoutubeDashboard projects={projects} onOpen={(id) => { setActiveProjectId(id); setView('workspace'); }} />}
            {view === 'settings' && <YoutubeSettings />}
            {view === 'guide' && <StyleGuideView guide={sirStyleGuide} onUpdate={setSirStyleGuide} />}
            {view === 'creators' && <CreatorPlaybookView creatorReferences={creatorReferences} setCreatorReferences={setCreatorReferences} activeCreatorId={activeCreatorId} setActiveCreatorId={setActiveCreatorId} />}
            {view === 'audiences' && <TargetAudienceView targetAudiences={targetAudiences} setTargetAudiences={setTargetAudiences} activeAudienceId={activeAudienceId} setActiveAudienceId={setActiveAudienceId} />}
            {view === 'brands' && <BrandVoicesView brandVoices={brandVoices} setBrandVoices={setBrandVoices} activeBrandVoiceId={activeBrandVoiceId} setActiveBrandVoiceId={setActiveBrandVoiceId} />}
            {view === 'thumbnails' && <ThumbnailStylesView thumbnailStyles={thumbnailStyles} setThumbnailStyles={setThumbnailStyles} activeThumbnailStyleId={activeThumbnailStyleId} setActiveThumbnailStyleId={setActiveThumbnailStyleId} />}
            {view === 'editing' && <EditingStylesView editingStyles={editingStyles} setEditingStyles={setEditingStyles} activeEditingStyleId={activeEditingStyleId} setActiveEditingStyleId={setActiveEditingStyleId} />}
            {view === 'formats' && <VideoFormatsView videoFormats={videoFormats} setVideoFormats={setVideoFormats} />}
            {view === 'hooks' && <HookLibraryView hookLibrary={hookLibrary} setHookLibrary={setHookLibrary} />}
            {view === 'new_project' && <YoutubeNewProject onCreate={async (p) => {
                try {
                    const payload = {
                        ...p,
                        WorkingTitle: p.title,
                        SourceType: p.sourceType,
                        ResearchBehavior: p.researchBehavior,
                        Strategy: p.strategy,
                        ContentType: p.contentType,
                        TargetAudience: p.targetAudience,
                        BusinessObjective: p.businessObj,
                        Notes: p.notes,
                        Status: 'In Research',
                        CurrentAgent: 1,
                        CurrentStage: 'Not Requested'
                    };
                    const res = await fetch(`${API_URL}/yt/projects`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const created = await res.json();

                    const mapped = {
                        id: parseInt(created.ProjectID.replace('YT-', ''), 10) || created.ProjectID,
                        projectId: created.ProjectID,
                        title: created.WorkingTitle,
                        sourceType: created.SourceType,
                        strategy: created.Strategy,
                        contentType: created.ContentType,
                        status: created.Status,
                        activeAgent: parseInt(created.CurrentAgent) || 1,
                        sirStatus: created.CurrentStage,
                        updatedAt: 'Just now',
                        businessObj: created.BusinessObjective,
                        targetAudience: created.TargetAudience
                    };
                    setProjects([mapped, ...projects]);
                    setActiveProjectId(mapped.id);
                    setView('workspace');
                } catch (err) {
                    console.error(err);
                }
            }} />}
            {view === 'workspace' && currentProject && (
                <WorkspaceErrorBoundary projectId={currentProject.projectId} onBack={() => { setView('dashboard'); setActiveProjectId(null); }}>
                    <YoutubeWorkspace project={currentProject} onBack={() => { setView('dashboard'); setActiveProjectId(null); }} learnFromFeedback={learnFromFeedback} />
                </WorkspaceErrorBoundary>
            )}
        </div>
    );
}

class WorkspaceErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, info) {
        console.error('WorkspaceErrorBoundary caught an error:', error, info);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flex: 1, flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
                    <div style={{ color: '#ef4444', fontWeight: 600, fontSize: '1.2rem' }}>YouTube Workspace Error</div>
                    <div style={{ color: '#e4e4e7' }}>Project: {this.props.projectId || 'Unknown'}</div>
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', color: '#fca5a5', width: '100%', maxWidth: '800px', textAlign: 'left', overflow: 'auto' }}>
                        <b>Reason:</b> <br />{this.state.error?.message}
                        <hr style={{ borderColor: 'rgba(239,68,68,0.2)', margin: '1rem 0' }} />
                        <pre style={{ fontSize: '0.75rem', margin: 0, whiteSpace: 'pre-wrap' }}>{this.state.error?.stack}</pre>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button className="yt-btn-primary" onClick={() => this.setState({ hasError: false, error: null })}>Retry</button>
                        <button className="yt-btn-secondary" onClick={this.props.onBack}>← Back to Projects</button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD VIEW
// ─────────────────────────────────────────────────────────────────────────────
function YoutubeDashboard({ projects, onOpen }) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All Status');
    const [activeTab, setActiveTab] = useState('All Projects');

    const getDisplayStatus = (p) => {
        if (p.currentStage && p.currentStage !== 'Not Requested' && p.currentStage !== 'In Research') {
            return p.currentStage;
        }
        return p.status || 'In Research';
    };

    const getProjectPhase = (p) => {
        if (p.currentAgent >= 1 && p.currentAgent <= 4) return 'Strategy & Planning';
        if (p.currentAgent >= 5 && p.currentAgent <= 6) return 'Content Production';
        if (p.currentAgent >= 7 && p.currentAgent <= 10) return 'Packaging';
        if (p.currentAgent >= 11 && p.currentAgent <= 15) return 'Finalization';
        return 'Strategy & Planning';
    };

    const TABS = [
        { id: 'All Projects', label: 'All Projects', agents: null, icon: '📺' },
        { id: 'Strategy & Planning', label: 'Strategy & Planning', agents: 'Agents 1-4', icon: '🧠' },
        { id: 'Content Production', label: 'Content Production', agents: 'Agents 5-6', icon: '✍️' },
        { id: 'Packaging', label: 'Packaging', agents: 'Agents 7-10', icon: '🎨' },
        { id: 'Finalization', label: 'Finalization', agents: 'Agents 11-15', icon: '🚀' }
    ];

    const filtered = projects.filter(p => {
        const mSearch = p.title.toLowerCase().includes(search.toLowerCase());
        const mappedFilter = filter === 'All Status' ? 'All' : filter;
        const disp = getDisplayStatus(p);
        const matchesTab = activeTab === 'All Projects' || getProjectPhase(p) === activeTab;
        return mSearch && (mappedFilter === 'All' || disp.includes(mappedFilter)) && matchesTab;
    });

    const counts = {};
    TABS.forEach(tab => {
        if (tab.id === 'All Projects') counts[tab.id] = projects.length;
        else counts[tab.id] = projects.filter(p => getProjectPhase(p) === tab.id).length;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {/* Workflow Tabs Pipeline */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginBottom: '1.2rem', overflowX: 'auto', paddingBottom: '0.8rem', flexShrink: 0 }} className="yt-custom-scrollbar">
                {TABS.map((tab, idx) => (
                    <React.Fragment key={tab.id}>
                        {idx > 0 && <span style={{ color: '#4b5563', margin: '0 0.6rem', fontSize: '0.75rem', opacity: 0.7 }}>❯</span>}
                        <button
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap',
                                background: activeTab === tab.id ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                border: `1px solid ${activeTab === tab.id ? 'rgba(139, 92, 246, 0.5)' : 'transparent'}`,
                                color: activeTab === tab.id ? '#fff' : '#a1a1aa', transition: 'all 0.2s', fontSize: '0.85rem',
                                display: 'flex', alignItems: 'center', gap: '0.6rem',
                                outline: 'none'
                            }}
                            onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                            onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.background = 'transparent' }}
                        >
                            <span style={{ fontSize: '1.2rem', opacity: activeTab === tab.id ? 1 : 0.6 }}>{tab.icon}</span>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                                <span style={{ fontWeight: activeTab === tab.id ? 600 : 500 }}>{tab.label}</span>
                                {tab.agents && <span style={{ fontSize: '0.65rem', color: '#a1a1aa' }}>{tab.agents}</span>}
                            </div>
                            <span style={{
                                background: activeTab === tab.id ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
                                color: activeTab === tab.id ? '#fff' : '#d4d4d8',
                                padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                                boxShadow: activeTab === tab.id ? '0 0 8px rgba(139, 92, 246, 0.5)' : 'none'
                            }}>
                                {counts[tab.id]}
                            </span>
                        </button>
                    </React.Fragment>
                ))}
            </div>

            {/* Search Bar Row */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexShrink: 0 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</div>
                    <input className="input-field" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem' }} />
                </div>
                <CustomSelect
                    value={filter}
                    onChange={setFilter}
                    options={['All Status', 'In Research', 'Waiting for Sir', 'Script Review', 'Editing', 'Published']}
                    style={{ width: '220px' }}
                />
            </div>

            {/* Projects Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {filtered.map(p => {
                    const currentStep = YT_AGENTS.find(a => a.id === p.currentAgent);
                    const dispStatus = getDisplayStatus(p);

                    const pColor = dispStatus.includes('Waiting for Sir') ? '#fbbf24' : (dispStatus.includes('Script') ? '#a855f7' : (dispStatus.includes('Strategy') ? '#34d399' : '#60a5fa'));
                    const pBg = dispStatus.includes('Waiting for Sir') ? 'rgba(251,191,36,0.1)' : (dispStatus.includes('Script') ? 'rgba(168,85,247,0.1)' : (dispStatus.includes('Strategy') ? 'rgba(52,211,153,0.1)' : 'rgba(96,165,250,0.1)'));

                    let currentStepName = currentStep?.name.split('. ')[1];
                    if (p.currentStage && p.currentStage.includes('Waiting for Sir')) currentStepName = `${currentStepName} (Sir Review)`;

                    return (
                        <div key={p.id} className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.05)' }}>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: pColor, background: pBg, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{dispStatus}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>YT-00{p.id}</span>
                            </div>

                            <h3 style={{ lineHeight: 1.3, margin: '0 0 1rem 0', fontSize: '1.05rem', color: '#e4e4e7', minHeight: '2.6em' }}>{p.title}</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '1.2rem' }}>
                                <div>Source: <span style={{ color: '#e4e4e7' }}>{p.sourceType}</span></div>
                                <div>Strategy: <span style={{ color: '#e4e4e7' }}>{p.strategy}</span></div>
                                <div>Content: <span style={{ color: '#e4e4e7' }}>{p.contentType}</span></div>
                                <div>Updated: <span style={{ color: '#e4e4e7' }}>{p.updatedAt}</span></div>
                            </div>

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0 -1.2rem 1rem -1.2rem' }}></div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                                <span>Current Step</span>
                                <span>Progress</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.6rem', color: '#e4e4e7' }}>
                                <span>{currentStepName}</span>
                                <span style={{ fontWeight: 600 }}>{Math.round((p.progress / 15) * 100)}%</span>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.05)', height: '4px', borderRadius: '2px', marginBottom: '1.2rem', overflow: 'hidden' }}>
                                <div style={{ width: `${(p.progress / 15) * 100}%`, background: pColor, height: '100%' }}></div>
                            </div>

                            <button className="yt-btn-secondary" onClick={() => onOpen(p.id)} style={{ width: '100%', marginTop: 'auto' }}>Continue →</button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW PROJECT SCREEN 
// ─────────────────────────────────────────────────────────────────────────────
function YoutubeNewProject({ onCreate }) {
    const [sourceType, setSourceType] = useState('Original Topic');
    const [researchBehavior, setResearchBehavior] = useState('research_topic');
    const [title, setTitle] = useState('');
    const [audienceGoal, setAudienceGoal] = useState('');
    const [businessObj, setBusinessObj] = useState('Education');
    const [strategy, setStrategy] = useState('Let Strategist Decide');
    const [contentType, setContentType] = useState('Let Strategist Decide');
    const [notes, setNotes] = useState('');
    const [dupState, setDupState] = useState(null);
    const [dupData, setDupData] = useState(null);

    // Existing Reference specific
    const [referenceLearnings, setReferenceLearnings] = useState([]);
    const [referenceUrl, setReferenceUrl] = useState('');
    const [referenceNotes, setReferenceNotes] = useState('');
    const [referenceFile, setReferenceFile] = useState(null);
    const fileInputRef = useRef(null);

    // Consultation specific
    const [consultationTranscript, setConsultationTranscript] = useState('');
    const [consultationContext, setConsultationContext] = useState('');
    const [consultationTurningPoint, setConsultationTurningPoint] = useState('');

    // Transformation specific
    const [transformationBefore, setTransformationBefore] = useState('');
    const [transformationChanged, setTransformationChanged] = useState('');
    const [transformationAfter, setTransformationAfter] = useState('');
    const [transformationTurningPoint, setTransformationTurningPoint] = useState('');
    const [transformationFocus, setTransformationFocus] = useState([]);

    const debounceTimer = useRef(null);

    const toggleLearning = (opt) => {
        setReferenceLearnings(prev => prev.includes(opt) ? prev.filter(p => p !== opt) : [...prev, opt]);
    };

    const toggleTransformationFocus = (opt) => {
        setTransformationFocus(prev => prev.includes(opt) ? prev.filter(p => p !== opt) : [...prev, opt]);
    };

    const handleSourceTypeChange = (type) => {
        setSourceType(type);
        setResearchBehavior('research_topic');
        setDupState(null);
    };

    const duplicationCheckUI = (
        <div style={{ minHeight: '1.5rem', marginTop: '0.4rem' }}>
            {title && dupState === 'none' && (
                <span style={{ color: '#34d399', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>✓ No similar topic found</span>
            )}
            {dupState === 'exact' && dupData && (
                <div style={{ color: '#f87171', fontSize: '0.8rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>⛔ Exact duplicate found</span>
                    <div style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {dupData.title} ({dupData.projectId} - {dupData.status})
                    </div>
                </div>
            )}
            {dupState === 'similar' && (
                <div style={{ color: '#fbbf24', fontSize: '0.8rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>⚠ Similar topic found</span>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.2rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Why Some Hair Systems Look Unnatural (YT-017)</span>
                        <a href="#" style={{ color: '#818cf8', textDecoration: 'none' }}>View Existing</a>
                        <a href="#" style={{ color: '#818cf8', textDecoration: 'none' }}>Continue Anyway</a>
                    </div>
                </div>
            )}
        </div>
    );

    const handleTopicChange = (e) => {
        const val = e.target.value;
        setTitle(val);

        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        if (val.length > 3) {
            debounceTimer.current = setTimeout(async () => {
                try {
                    const res = await fetch(`${API_URL}/yt/topics/check-duplicate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: val })
                    });
                    const data = await res.json();
                    if (data.type === 'exact') {
                        setDupState('exact');
                        setDupData(data);
                    } else {
                        setDupState('none');
                    }
                } catch (e) {
                    setDupState('none');
                }
            }, 400);
        } else {
            setDupState(null);
        }
    };

    const isSubmitDisabled = () => {
        if (dupState === 'exact') return true;
        if (sourceType === 'Existing Reference') {
            if (!referenceUrl && !referenceFile) return true;
            if (researchBehavior === 'research_topic' && !title) return true;
        }
        if (sourceType === 'Original Topic') {
            if (!title) return true;
        }
        return false;
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setReferenceFile(e.target.files[0]);
        }
    };

    const handleRemoveFile = (e) => {
        e.stopPropagation();
        setReferenceFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const triggerFileSelect = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const getFileTypeLabel = (file) => {
        if (!file.type) return 'Document';
        if (file.type.startsWith('video/')) return 'Video';
        if (file.type.startsWith('audio/')) return 'Audio';
        if (file.type === 'application/pdf') return 'PDF';
        if (file.type === 'text/plain') return 'Text';
        return 'Document';
    };

    const getFileIcon = (file) => {
        if (!file.type) return '📄';
        if (file.type.startsWith('video/')) return '🎬';
        if (file.type.startsWith('audio/')) return '🎧';
        if (file.type === 'application/pdf') return '📕';
        if (file.type === 'text/plain') return '📝';
        return '📄';
    };

    const getFileSizeLabel = (size) => {
        if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
        return (size / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '900px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', overflow: 'visible' }}>

                {/* ROW 1: Source */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#e4e4e7' }}>1. How are you starting?</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className={`yt-card-btn ${sourceType === 'Original Topic' ? 'active' : ''}`} onClick={() => handleSourceTypeChange('Original Topic')}>Original Topic</button>
                        <button className={`yt-card-btn ${sourceType === 'Consultation' ? 'active' : ''}`} onClick={() => handleSourceTypeChange('Consultation')}>Consultation</button>
                        <button className={`yt-card-btn ${sourceType === 'Transformation' ? 'active' : ''}`} onClick={() => handleSourceTypeChange('Transformation')}>Transformation</button>
                        <button className={`yt-card-btn ${sourceType === 'Existing Reference' ? 'active' : ''}`} onClick={() => handleSourceTypeChange('Existing Reference')}>Existing Reference</button>
                    </div>
                </div>

                {/* ROW 2: Topic & Behavior */}
                {sourceType === 'Existing Reference' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.75rem', color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>★ Reference Blueprint Active</div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reference URL</label>
                            <input className="input-field" value={referenceUrl} onChange={e => setReferenceUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." style={{ width: '100%' }} />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upload Reference Video / Transcript</label>

                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept=".mp4,.mov,.webm,.mp3,.wav,.txt,.pdf"
                                onChange={handleFileSelect}
                            />

                            {!referenceFile ? (
                                <div className="yt-upload-zone" onClick={triggerFileSelect}>
                                    <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>📁</div>
                                    <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.2rem' }}>Choose a reference file</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Video, audio, transcript or PDF</div>
                                </div>
                            ) : (
                                <div className="yt-file-card">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ fontSize: '1.5rem', color: '#a855f7' }}>{getFileIcon(referenceFile)}</div>
                                        <div>
                                            <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.2rem' }}>{referenceFile.name}</div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{getFileTypeLabel(referenceFile)} • {getFileSizeLabel(referenceFile.size)}</div>
                                            <div style={{ color: '#34d399', fontSize: '0.7rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                <span style={{ fontSize: '0.85rem' }}>✓</span> File selected
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                                        <button type="button" onClick={triggerFileSelect} className="yt-btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Change File</button>
                                        <button type="button" onClick={handleRemoveFile} className="yt-btn-danger-ghost">Remove</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>What should we learn from this reference?</label>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {['Topic / Idea', 'Structure', 'Storytelling', 'Title / Packaging', 'Thumbnail Direction', 'Editing / Pacing'].map(opt => (
                                    <button key={opt} type="button" onClick={() => toggleLearning(opt)} className={`yt-card-btn ${referenceLearnings.includes(opt) ? 'active' : ''}`} style={referenceLearnings.includes(opt) ? { boxShadow: '0 0 8px rgba(139,92,246,0.6)' } : {}}>
                                        {referenceLearnings.includes(opt) ? '✓ ' : ''}{opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: '#e4e4e7' }}>2. What should Research do?</label>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                <button onClick={() => setResearchBehavior('research_topic')} className={`yt-card-btn ${researchBehavior === 'research_topic' ? 'active' : ''}`}>Research this new direction</button>
                                <button onClick={() => setResearchBehavior('suggest_topics')} className={`yt-card-btn ${researchBehavior === 'suggest_topics' ? 'active' : ''}`}>Find topics from this reference</button>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', color: '#e4e4e7' }}>New Topic / Direction {researchBehavior === 'suggest_topics' ? '(Optional)' : ''}</label>
                            <input className="input-field" value={title} onChange={handleTopicChange} placeholder={researchBehavior === 'suggest_topics' ? "Any direction notes..." : "Enter your new topic..."} style={{ width: '100%' }} />
                            {duplicationCheckUI}
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Notes / Instructions</label>
                            <textarea className="input-field" value={referenceNotes} onChange={e => setReferenceNotes(e.target.value)} rows="2" placeholder="Specific things to adopt or ignore..." style={{ width: '100%' }}></textarea>
                        </div>
                    </div>
                ) : sourceType === 'Transformation' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.75rem', color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.5px' }}>★ Transformation Story Active</div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: '#e4e4e7' }}>2. What should Research do?</label>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <button onClick={() => setResearchBehavior('research_topic')} className={`yt-card-btn ${researchBehavior === 'research_topic' ? 'active' : ''}`}>I already have the video topic</button>
                                <button onClick={() => setResearchBehavior('suggest_topics')} className={`yt-card-btn ${researchBehavior === 'suggest_topics' ? 'active' : ''}`}>Let Research suggest topics from this transformation</button>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', color: '#e4e4e7' }}>Transformation Title / Topic {researchBehavior === 'suggest_topics' ? '(Optional)' : ''}</label>
                            <input className="input-field" value={title} onChange={handleTopicChange} placeholder="Enter transformation topic..." style={{ width: '100%' }} />
                            {duplicationCheckUI}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Before Situation</label>
                                <textarea className="input-field" rows="2" value={transformationBefore} onChange={e => setTransformationBefore(e.target.value)} style={{ width: '100%' }}></textarea>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>After / Outcome</label>
                                <textarea className="input-field" rows="2" value={transformationAfter} onChange={e => setTransformationAfter(e.target.value)} style={{ width: '100%' }}></textarea>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>What Changed</label>
                            <textarea className="input-field" rows="2" value={transformationChanged} onChange={e => setTransformationChanged(e.target.value)} style={{ width: '100%' }}></textarea>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Key Turning Point</label>
                            <textarea className="input-field" rows="2" value={transformationTurningPoint} onChange={e => setTransformationTurningPoint(e.target.value)} style={{ width: '100%' }}></textarea>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>What should the video focus on?</label>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {['Confidence', 'Natural Look', 'Process', 'Decision Journey', 'Result', 'Education'].map(opt => (
                                    <button key={opt} type="button" onClick={() => toggleTransformationFocus(opt)} className={`yt-card-btn ${transformationFocus.includes(opt) ? 'active' : ''}`} style={transformationFocus.includes(opt) ? { boxShadow: '0 0 8px rgba(139,92,246,0.6)' } : {}}>
                                        {transformationFocus.includes(opt) ? '✓ ' : ''}{opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: '#e4e4e7' }}>2. What should Research do?</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            {sourceType === 'Original Topic' ? (
                                <>
                                    <button onClick={() => setResearchBehavior('research_topic')} className={`yt-card-btn ${researchBehavior === 'research_topic' ? 'active' : ''}`}>Research this topic</button>
                                    <button onClick={() => setResearchBehavior('suggest_topics')} className={`yt-card-btn ${researchBehavior === 'suggest_topics' ? 'active' : ''}`}>Suggest video topics from this idea</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setResearchBehavior('research_topic')} className={`yt-card-btn ${researchBehavior === 'research_topic' ? 'active' : ''}`}>I already have the video topic</button>
                                    <button onClick={() => setResearchBehavior('suggest_topics')} className={`yt-card-btn ${researchBehavior === 'suggest_topics' ? 'active' : ''}`}>Let Research suggest topics from this consultation</button>
                                </>
                            )}
                        </div>

                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#e4e4e7' }}>
                            {sourceType === 'Consultation' ? 'Video Topic / Seed Idea (Optional)' : 'Topic / Seed Idea'}
                        </label>
                        <input className="input-field" value={title} onChange={handleTopicChange} placeholder="Why Hair Systems Look Fake" style={{ width: '100%' }} />
                        {duplicationCheckUI}
                    </div>
                )}

                {/* Consultation Specific - Only shown if selected */}
                {sourceType === 'Consultation' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ gridColumn: '1 / -1', fontSize: '0.75rem', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px' }}>★ Consultation Storytelling Active</div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Consultation Transcript / Notes</label>
                            <textarea className="input-field" rows="2" placeholder="Paste / Upload Consultation Transcript" value={consultationTranscript} onChange={e => setConsultationTranscript(e.target.value)}></textarea>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Client Context / Key Notes</label>
                            <textarea className="input-field" rows="2" placeholder="..." value={consultationContext} onChange={e => setConsultationContext(e.target.value)}></textarea>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Key Concern / Turning Point</label>
                            <textarea className="input-field" rows="2" placeholder="..." value={consultationTurningPoint} onChange={e => setConsultationTurningPoint(e.target.value)}></textarea>
                        </div>
                    </div>
                )}

                {/* ROW 3 & 4: Audience & Business Obj */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', overflow: 'visible' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#e4e4e7' }}>3. Target Audience</label>
                        <input className="input-field" value={audienceGoal} onChange={e => setAudienceGoal(e.target.value)} placeholder="Men & Women 25-45" style={{ width: '100%' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#e4e4e7' }}>4. Business Objective</label>
                        <CustomSelect
                            value={businessObj}
                            onChange={setBusinessObj}
                            options={['Education', 'Awareness', 'Authority', 'Leads']}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '-0.5rem', overflow: 'visible' }}>
                    <div style={{ gridColumn: '1', display: 'flex', flexDirection: 'column' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#e4e4e7' }}>5. Strategy Preference</label>
                        <CustomSelect
                            value={strategy}
                            onChange={setStrategy}
                            options={['Let Strategist Decide', 'Search', 'Browse']}
                        />
                    </div>
                    <div style={{ gridColumn: '2', display: 'flex', flexDirection: 'column' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#e4e4e7' }}>6. Content Type</label>
                        <CustomSelect
                            value={contentType}
                            onChange={setContentType}
                            options={['Let Strategist Decide', 'Evergreen', 'Trending']}
                        />
                    </div>
                </div>

                {/* ROW 5: Notes */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#e4e4e7' }}>7. Notes / Context (Optional)</label>
                    <textarea className="input-field" rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Focus on customization and consultation journey. Avoid negative framing." style={{ height: '60px' }} />
                </div>

                <button className="yt-btn-primary" disabled={isSubmitDisabled()} onClick={() => {
                    const extraData = {};
                    if (sourceType === 'Existing Reference') {
                        extraData.referenceUrl = referenceUrl;
                        extraData.referenceLearnings = referenceLearnings;
                        extraData.referenceNotes = referenceNotes;
                        if (referenceFile) {
                            extraData.ReferenceFileName = referenceFile.name;
                            extraData.ReferenceFileType = referenceFile.type;
                            extraData.ReferenceFileSize = referenceFile.size;
                        }
                    } else if (sourceType === 'Consultation') {
                        extraData.consultationTranscript = consultationTranscript;
                        extraData.consultationContext = consultationContext;
                        extraData.consultationTurningPoint = consultationTurningPoint;
                    } else if (sourceType === 'Transformation') {
                        extraData.transformationBefore = transformationBefore;
                        extraData.transformationChanged = transformationChanged;
                        extraData.transformationAfter = transformationAfter;
                        extraData.transformationTurningPoint = transformationTurningPoint;
                        extraData.transformationFocus = transformationFocus;
                    }
                    onCreate({
                        title, sourceType, researchBehavior, strategy, contentType,
                        targetAudience: audienceGoal, businessObj, notes,
                        ...extraData
                    });
                }} style={{ padding: '0.8rem', fontSize: '1rem', marginTop: '1rem' }}>
                    Create Project Workspace
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT WORKSPACE - FIXED HEIGHT APPLICATION LAYOUT
// ─────────────────────────────────────────────────────────────────────────────
function YoutubeWorkspace({ project, onBack, learnFromFeedback }) {
    const [fullProject, setFullProject] = useState(null);
    const [activeAgentId, setActiveAgentId] = useState(project.currentAgent || 1);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [sirFeedbackText, setSirFeedbackText] = useState('');
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [copyBriefText, setCopyBriefText] = useState('Copy Brief');

    const [viewingVersion, setViewingVersion] = useState(null);
    const [jobStatusMsg, setJobStatusMsg] = useState('');

    // Data State
    const [runs, setRuns] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isSubmittingSirReview, setIsSubmittingSirReview] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    // Selected Angle (Agent 2)
    const [selectedAngleId, setSelectedAngleId] = useState(null);
    const [isSubmittingForSir, setIsSubmittingForSir] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api');

    const AGENT_KEY_MAP = {
        1: 'research', 2: 'content_angle', 3: 'strategist', 4: 'structure', 5: 'script',
        6: 'creative_director', 7: 'thumbnail_strategist', 8: 'thumbnail_designer',
        9: 'title_strategist', 10: 'seo', 10.5: 'metadata', 11: 'editor', 12: 'retention',
        13: 'brand', 14: 'qc', 15: 'analytics'
    };

    const fetchWorkspaceData = async (silent = false) => {
        console.log(`Workspace projectId: ${project?.projectId}`);
        if (!project?.projectId) {
            setErrorMsg("No Project ID provided to workspace context.");
            if (!silent) setLoading(false);
            return;
        }

        setErrorMsg(null);
        if (!silent && !fullProject) setLoading(true);

        try {
            console.log('Starting workspace fetch...');

            // Critical
            const pRes = await fetch(`${API_URL}/yt/projects/${project.projectId}`);
            if (!pRes.ok) throw new Error(`Project fetch failed with HTTP ${pRes.status}`);
            const pData = await pRes.json();
            setFullProject(pData);
            let finalPData = pData;

            // Optional 
            const results = await Promise.allSettled([
                fetch(`${API_URL}/yt/projects/${project.projectId}/agent-runs`),
                fetch(`${API_URL}/yt/projects/${project.projectId}/feedback`)
            ]);

            const [rResult, fResult] = results;
            if (rResult.status === 'fulfilled' && rResult.value.ok) {
                try {
                    const rData = await rResult.value.json();
                    if (Array.isArray(rData)) setRuns(rData);
                } catch (e) { console.error('Agent runs parse error', e); }
            }
            if (fResult.status === 'fulfilled' && fResult.value.ok) {
                try {
                    const fData = await fResult.value.json();
                    if (Array.isArray(fData)) setFeedbacks(fData);
                } catch (e) { console.error('Feedback parse error', e); }
            }
            return finalPData;

        } catch (e) {
            console.error('Fetch err', e);
            setErrorMsg(e.message);
        } finally {
            if (!silent || !fullProject) setLoading(false);
        }
        return null;
    };

    useEffect(() => {
        setViewingVersion(null);
        setActiveAgentId(project?.activeAgent || project?.currentAgent || 1);
        fetchWorkspaceData();
    }, [project?.projectId]);

    useEffect(() => {
        const key = AGENT_KEY_MAP[activeAgentId];
        const aRuns = runs.filter(r => r.AgentKey === key).sort((a, b) => b.Version - a.Version);
        const lRun = viewingVersion ? aRuns.find(r => String(r.Version) === String(viewingVersion)) || aRuns[0] : aRuns[0];
        if (lRun) {
            try {
                let out = typeof lRun.OutputData === 'string' ? JSON.parse(lRun.OutputData) : lRun.OutputData;
                if (out && out.selectedAngleId) {
                    setSelectedAngleId(out.selectedAngleId);
                } else {
                    setSelectedAngleId(null);
                }
            } catch (e) {
                // Ignore parse errors safely
            }
        }
    }, [runs, activeAgentId, viewingVersion]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flex: 1, flexDirection: 'column' }}>
                <div style={{ color: '#a1a1aa', marginBottom: '1rem' }}>Loading project workspace...</div>
            </div>
        );
    }

    if (!fullProject) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flex: 1, flexDirection: 'column', gap: '1rem' }}>
                <div style={{ color: '#ef4444', fontWeight: 600, fontSize: '1.2rem' }}>Unable to load project workspace.</div>
                <div style={{ color: '#e4e4e7' }}>Project: {project?.projectId || 'Unknown'}</div>
                {errorMsg && <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', color: '#fca5a5', maxWidth: '600px', textAlign: 'center' }}>Reason:<br />{errorMsg}</div>}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button className="yt-btn-primary" onClick={fetchWorkspaceData}>Retry</button>
                    <button className="yt-btn-secondary" onClick={onBack}>← Back to Projects</button>
                </div>
            </div>
        );
    }

    const activeAgentKey = AGENT_KEY_MAP[activeAgentId];
    const activeAgent = YT_AGENTS.find(a => a.id === activeAgentId);

    // Filter runs for current agent ensuring array safety
    const safeRuns = Array.isArray(runs) ? runs : [];
    const safeFeedbacks = Array.isArray(feedbacks) ? feedbacks : [];

    const currentAgentRuns = safeRuns.filter(r => r.AgentKey === activeAgentKey).sort((a, b) => (parseInt(b.Version) || 0) - (parseInt(a.Version) || 0));
    const latestRun = viewingVersion ? currentAgentRuns.find(r => String(r.Version) === String(viewingVersion)) || currentAgentRuns[0] : currentAgentRuns[0];
    const isApproved = latestRun?.IsApproved === true || String(latestRun?.IsApproved) === 'true';

    // Sir check
    const sirFeedbacks = safeFeedbacks.filter(f => f.Stage === activeAgentKey && f.IsSirFeedback && String(f.IsSirFeedback) === 'true').sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
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
        setIsGenerating(true);
        setErrorMsg(null);
        setJobStatusMsg('Starting Agent Execution...');
        try {
            const payload = {
                feedback: isRegeneration ? feedbackText : '',
                previousOutput: isRegeneration && latestRun ? latestRun.OutputData : null
            };

            if (activeAgentId >= 3) {
                const angleRun = runs.filter(r => r.AgentKey === 'content_angle' && String(r.IsApproved) === 'true')[0];
                if (angleRun) {
                    const adata = typeof angleRun.OutputData === 'string' ? JSON.parse(angleRun.OutputData) : angleRun.OutputData;
                    payload.selectedAngleData = adata?.angles?.find(a => a.id === selectedAngleId) || adata?.angles?.[0];
                }
            }

            if (isRegeneration && feedbackText) {
                await fetch(`${API_URL}/yt/projects/${fullProject.ProjectID}/agents/${activeAgentKey}/feedback`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ feedback: feedbackText, version: latestRun ? latestRun.Version : 1 })
                }).catch(console.error);
            }

            // Immediately trigger generation WITHOUT blocking the frontend for Vercel's 10s limit
            const fetchPromise = fetch(`${API_URL}/youtube/generate`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: fullProject.ProjectID, currentAgent: activeAgentId, payload })
            });

            // Artificial 5-second intercept to gracefully shift UI into polling mode
            const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('RACE_TIMEOUT'), 5000));
            const raceResult = await Promise.race([fetchPromise, timeoutPromise]);

            if (raceResult === 'RACE_TIMEOUT') {
                // Agent is now processing in the AWS Lambda background!
                setJobStatusMsg('Agent is working in the background. Please wait...');
                const originalLength = currentAgentRuns.length;
                let hitCount = 0;

                const pollInterval = setInterval(async () => {
                    hitCount++;
                    if (hitCount > 90) { // 6 minutes hard stop (90 * 4s) to allow massive Script Generations
                        clearInterval(pollInterval);
                        setIsGenerating(false);
                        setJobStatusMsg('');
                        fetchWorkspaceData(true);
                        return;
                    }
                    try {
                        const rRes = await fetch(`${API_URL}/yt/projects/${fullProject.ProjectID}/agent-runs`);
                        if (!rRes.ok) return;
                        const rData = await rRes.json();
                        if (Array.isArray(rData)) {
                            const newRuns = rData.filter(r => r.AgentKey === activeAgentKey);
                            if (newRuns.length > originalLength) {
                                // Agent completely successfully generated inside Vercel background!
                                clearInterval(pollInterval);
                                setRuns(rData);
                                setFeedbackText('');
                                setShowFeedback(false);
                                setJobStatusMsg('');
                                setIsGenerating(false);
                                fetchWorkspaceData(true);
                            }
                        }
                    } catch (e) {
                        // ignore network stutter during background silent polls
                    }
                }, 4000);
                return; // halt and rely entirely on the polling cycle for UI state!
            }

            // If we completed under 5 seconds (e.g. grabbed from db cache)
            const textResponse = await raceResult.text();
            let data;
            try {
                data = JSON.parse(textResponse);
            } catch (e) {
                // Native timeout / invalid dump
                throw new Error("Invalid response format from server.");
            }

            if (!raceResult.ok || data.status === 'failed') throw new Error(data.error || 'Agent execution failed');

            setFeedbackText('');
            setShowFeedback(false);
            setJobStatusMsg('');
            fetchWorkspaceData(true);
            setIsGenerating(false);
        } catch (e) {
            setErrorMsg(e.message);
            setIsGenerating(false);
            setJobStatusMsg('');
        }
    };

    const handleApprove = async () => {
        if (!latestRun) return;
        setIsApproving(true);
        try {
            const res = await fetch(`${API_URL}/youtube/approve`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: fullProject.ProjectID, agentKey: activeAgentKey, runId: latestRun.RunID, selectedAngleId })
            });

            if (!res.ok) throw new Error('Approval failed');

            const updatedProject = await fetchWorkspaceData();

            if (updatedProject && updatedProject.CurrentAgent) {
                setActiveAgentId(Number(updatedProject.CurrentAgent));
            } else if (!activeAgent?.hasSir && activeAgentId < 10) {
                setActiveAgentId(activeAgentId + 1);
            }

        } catch (e) {
            console.error(e);
            setErrorMsg(e.message);
        } finally {
            setIsApproving(false);
        }
    };

    const handleSelectTopic = async (topicIdea) => {
        setActionLoading(true);
        try {
            const res = await fetch(`${API_URL}/yt/projects/${fullProject.ProjectID}/topics/select`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topicIdea })
            });

            if (!res.ok) throw new Error('Topic selection failed');

            // Force refetch to update project status. Do NOT auto advance to agent 2 yet.
            await fetchWorkspaceData();
        } catch (e) {
            console.error(e);
            setErrorMsg(e.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSubmitToSir = async () => {
        if (!latestRun) return;
        setIsSubmittingForSir(true);
        try {
            const res = await fetch(`${API_URL}/yt/projects/${fullProject.ProjectID}/agents/${activeAgentKey}/submit-sir`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ runId: latestRun.RunID, selectedAngleId })
            });
            if (!res.ok) throw new Error('Submission failed');
            await fetchWorkspaceData(true);
        } catch (e) {
            setErrorMsg(e.message);
        } finally {
            setIsSubmittingForSir(false);
        }
    };
    const handleVoiceUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsTranscribing(true);
        setErrorMsg(null);

        const formData = new FormData();
        formData.append('audio', file);

        try {
            // Note: The global transcribe API expects /transcribe.
            // Vite handles API_URL properly if configured.
            const transcribeUrl = API_URL.endsWith('/api')
                ? API_URL.replace('/api', '') + '/api/transcribe'
                : `${API_URL}/transcribe`;

            const res = await fetch(transcribeUrl, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Transcription error ${res.status}`);

            const data = await res.json();
            const transcript = data.text || '';

            setSirFeedbackText(prev => prev ? `${prev}\n\n${transcript}` : transcript);
        } catch (e) {
            setErrorMsg(`Voice Note Error: ${e.message}`);
        } finally {
            setIsTranscribing(false);
            e.target.value = null; // Reset the input
        }
    };

    const handleCopyBrief = async () => {
        try {
            if (activeAgentId === 2 && !selectedAngleId) {
                setCopyBriefText('Select an angle first.');
                setTimeout(() => setCopyBriefText('Copy Brief'), 2000);
                return;
            }

            let briefText = `Project: ${fullProject.ProjectID}\n\nVideo Topic:\n${fullProject.WorkingTitle || 'Not provided'}\n\n`;

            if (activeAgentId === 2) {
                let angleObj = typeof latestRun?.OutputData === 'string' ? JSON.parse(latestRun.OutputData) : (latestRun?.OutputData || {});
                const angle = angleObj?.angles?.find(x => x.id === selectedAngleId);

                briefText += `Target Audience:\n${fullProject.TargetAudience || 'Not provided'}\n\n`;
                briefText += `Business Objective:\n${fullProject.BusinessObjective || 'Not provided'}\n\n`;

                if (angle) {
                    briefText += `Selected Angle:\n${angle.angleTitle || angle.title || 'Not provided'}\n\n`;
                    briefText += `Approach:\n${angle.coreConcept || angle.approach || 'Not provided'}\n\n`;
                    briefText += `Audience Pain:\n${angle.audiencePainPoint || angle.description || 'Not provided'}\n\n`;
                    briefText += `Why It Could Work:\n${angle.whyItWorks || angle.whyItCouldWork || 'Not provided'}\n\n`;
                    briefText += `Strategy / Format:\n${angle.recommendedFormat || angle.searchOrBrowse || 'Not provided'}\n\n`;
                    briefText += `Business Intent:\n${angle.businessIntent || angle.evergreenOrTrending || 'Not provided'}\n\n`;
                }

                briefText += `Please review this angle and share:\n\n- Approve\nOR\n- Feedback / changes required`;
            } else if (activeAgentId === 4) {
                let structObj = typeof latestRun?.OutputData === 'string' ? JSON.parse(latestRun.OutputData) : (latestRun?.OutputData || {});

                briefText += `Video Promise:\n${structObj.openingPromise || 'Not provided'}\n\n`;
                briefText += `Hook Strategy:\n${structObj.hookStrategy || 'Not provided'}\n\n`;
                briefText += `Story Arc:\n${structObj.storyArc || 'Not provided'}\n\n`;

                briefText += `Chapter Flow:\n`;
                if (Array.isArray(structObj.chapterFlow)) {
                    structObj.chapterFlow.forEach((ch, idx) => {
                        briefText += `${idx + 1}. ${ch.chapterTitle || 'Chapter'}\n   ${ch.purpose || ''}\n\n`;
                    });
                } else {
                    briefText += `Not provided\n\n`;
                }

                briefText += `Curiosity Loops:\n`;
                if (Array.isArray(structObj.curiosityLoops)) {
                    structObj.curiosityLoops.forEach(loop => briefText += `- ${loop}\n`);
                }
                briefText += `\n`;

                briefText += `Expected Length:\n${structObj.expectedLength || structObj.expectedVideoLength || 'Not provided'}\n\n`;
                briefText += `CTA Placement:\n${structObj.ctaPlacement || 'Not provided'}\n\n`;
                briefText += `Ending Strategy:\n${structObj.endingStrategy || 'Not provided'}\n\n`;

                briefText += `Please review the structure and share:\n- Approve\nOR\n- Feedback / changes required`;
            } else if (activeAgentId === 5) {
                let scriptObj = typeof latestRun?.OutputData === 'string' ? JSON.parse(latestRun.OutputData) : (latestRun?.OutputData || {});

                let approvedAngleName = "Not provided";
                let scriptDirection = "Maintains approved structure and factual grounding for the target audience.";

                // Fetch the actual selected angle from Agent 2's approved run
                const angleRun = runs.filter(r => r.AgentKey === 'content_angle' && String(r.IsApproved) === 'true')[0];
                if (angleRun) {
                    const adata = typeof angleRun.OutputData === 'string' ? JSON.parse(angleRun.OutputData) : angleRun.OutputData;
                    const selectedAngle = adata.angles?.find(a => a.id === adata.selectedAngleId) || adata.angles?.[0];
                    if (selectedAngle) {
                        approvedAngleName = selectedAngle.angleTitle || selectedAngle.title;

                        // Identify approach/concept
                        let approachDesc = selectedAngle.coreConcept || selectedAngle.approach || "narrative";
                        approachDesc = approachDesc.toLowerCase();

                        // Extract focus target
                        let focusTarget = fullProject.WorkingTitle || 'the primary topic';
                        if (fullProject.SourceType === 'Transformation' && fullProject.transformationFocus) {
                            focusTarget = fullProject.transformationFocus;
                        }

                        // Clean focus
                        let cleanFocus = focusTarget.split(/[.!?]/)[0].trim().toLowerCase();

                        // Clean Audience
                        let audience = fullProject.TargetAudience ? fullProject.TargetAudience.toLowerCase() : 'viewers';

                        let concept = approachDesc;
                        if (!concept.includes('style') && !concept.includes('approach') && !concept.includes('format') && !concept.includes('masterclass') && !concept.includes('documentary')) {
                            concept += ' narrative format';
                        }
                        let sourceTypeLabel = fullProject.SourceType ? fullProject.SourceType.toLowerCase() : 'research';

                        // The exact grammatical fix requested by the user
                        const grammarFix = /^[aeiou]/i.test(concept) ? 'An' : 'A';
                        scriptDirection = `${grammarFix} structured ${concept} focused on helping ${audience} navigate the reality of ${cleanFocus}. The script maps our ${sourceTypeLabel} insights into the approved step-by-step structure to prioritize practical, retention-driven guidance.`;
                    }
                }

                briefText = `Project:\n${fullProject.ProjectID}\n\n`;
                briefText += `Video Topic:\n${fullProject.WorkingTitle || 'Not provided'}\n\n`;
                briefText += `Source Type:\n${fullProject.SourceType || 'Not provided'}\n\n`;
                briefText += `Approved Angle:\n${approvedAngleName}\n\n`;
                briefText += `Strategy Preference:\n${fullProject.Strategy || 'Not provided'}\n\n`;
                briefText += `Script Version:\nVersion ${latestRun.Version}\n\n`;
                briefText += `Estimated Length:\n${scriptObj.estimatedDurationMinutes || '?'} minutes\n\n`;
                briefText += `Estimated Word Count:\n${scriptObj.estimatedWordCount || '?'}\n\n`;

                briefText += `Script Direction:\n${scriptDirection}\n\n`;

                briefText += `Review Focus:\n`;
                briefText += `- Overall story and positioning\n`;
                briefText += `- Alignment with approved angle\n`;
                briefText += `- Factual/source accuracy\n`;
                briefText += `- Sections to add, remove or change\n`;
                briefText += `- Tone and pacing\n\n`;

                briefText += `Please review this script version and share:\n\nApprove\nOR\nFeedback / changes required`;
            } else if (activeAgentId === 10) {
                let seoObj = typeof latestRun?.OutputData === 'string' ? JSON.parse(latestRun.OutputData) : (latestRun?.OutputData || {});
                seoObj = seoObj.seoPackage || seoObj;

                briefText += `Primary Keyword:\n${seoObj.primaryKeyword || 'Not provided'}\n\n`;
                briefText += `Description:\n${seoObj.description || 'Not provided'}\n\n`;
                briefText += `Review Focus:\n- Accuracy of claims and keywords\n- Alignment with American Hairline premium tone\n\n`;
                briefText += `Please review this metadata package and share:\n\nApprove\nOR\nFeedback / changes required`;
            } else if (activeAgentId === 14) {
                const getOutput = (agentKey) => {
                    const run = runs.filter(r => r.AgentKey === agentKey && String(r.IsApproved) === 'true').pop();
                    if (!run || !run.OutputData) return null;
                    try { return typeof run.OutputData === 'string' ? JSON.parse(run.OutputData) : run.OutputData; } catch (e) { return null; }
                };

                const angData = getOutput('content_angle');
                const selectedAngle = angData?.angles?.find(a => a.id === angData.selectedAngleId) || angData?.angles?.[0];
                const angleName = selectedAngle?.angleTitle || selectedAngle?.title || 'Not provided';

                const titleData = getOutput('title_strategist');
                const title = titleData?.selectedTitle || titleData?.titles?.[0]?.title || 'Not provided';

                let scriptDir = "Maintains approved structure and factual grounding for the target audience.";
                if (selectedAngle) {
                    let concept = (selectedAngle.coreConcept || selectedAngle.approach || "narrative").toLowerCase();
                    if (!concept.includes('style') && !concept.includes('format')) concept += ' narrative format';
                    const grammarFix = /^[aeiou]/i.test(concept) ? 'An' : 'A';
                    let cleanFocus = fullProject.WorkingTitle?.split(/[.!?]/)[0].trim().toLowerCase() || 'the topic';
                    let audience = fullProject.TargetAudience?.toLowerCase() || 'viewers';
                    scriptDir = `${grammarFix} structured ${concept} focused on helping ${audience} navigate the reality of ${cleanFocus}.`;
                }

                const retentionData = getOutput('retention');
                let retentionRisks = retentionData?.dropOffPoints?.filter(d => d.riskLevel === 'High').map(d => d.reason).join(" | ");
                if (!retentionRisks) retentionRisks = 'No high-risk drop-off points flagged.';

                const brandData = getOutput('brand');
                let brandNotes = brandData?.requiredChanges?.length > 0 ? brandData.requiredChanges.join(" | ") : (brandData?.approvalStatus || 'Fully aligned with brand.');

                const qcData = typeof latestRun?.OutputData === 'string' ? JSON.parse(latestRun.OutputData) : (latestRun?.OutputData || {});
                const qcDecision = qcData?.finalDecision || (qcData?.publishReady ? 'Approve' : 'Changes Required');

                briefText = `Project:\n${fullProject.ProjectID}\n\n`;
                briefText += `Video Topic:\n${fullProject.WorkingTitle || 'Not provided'}\n\n`;
                briefText += `Approved Angle:\n${angleName}\n\n`;
                briefText += `Selected Title:\n${title}\n\n`;
                briefText += `Script Direction:\n${scriptDir}\n\n`;
                briefText += `Retention Review:\n${retentionRisks}\n\n`;
                briefText += `Brand Review:\n${brandNotes}\n\n`;
                briefText += `QC Recommendation:\n${qcDecision}`;
            }

            await navigator.clipboard.writeText(briefText);
            setCopyBriefText('Copied ✓');
            setTimeout(() => setCopyBriefText('Copy Brief'), 2000);
        } catch (e) {
            setErrorMsg(`Clipboard Error: ${e.message}`);
        }
    };

    const handleSirSubmit = async (isApproval) => {
        setIsSubmittingSirReview(true);
        try {

            const res = await fetch(`${API_URL}/yt/projects/${fullProject.ProjectID}/sir-review`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stage: activeAgentKey, feedbackText: sirFeedbackText, isApproved: isApproval, version: latestRun?.Version })
            });
            if (!res.ok) throw new Error('Sir review update failed');

            // ── TRIGGER AUTONOMOUS LEARNING ──
            if (!isApproval && sirFeedbackText?.trim()) {
                if (typeof learnFromFeedback === 'function') {
                    // Send it to the autonomous system without blocking
                    learnFromFeedback({
                        sirFeedback: sirFeedbackText,
                        scriptBefore: typeof latestRun?.OutputData === 'string' ? latestRun.OutputData : JSON.stringify(latestRun?.OutputData || {}),
                        topic: fullProject.WorkingTitle || ''
                    });
                }
            }

            setSirFeedbackText('');

            const updatedProject = await fetchWorkspaceData();

            if (isApproval) {
                if (updatedProject && updatedProject.CurrentAgent) {
                    setActiveAgentId(Number(updatedProject.CurrentAgent));
                } else if (activeAgentId < 10) {
                    setActiveAgentId(activeAgentId + 1);
                }
            }
        } catch (e) {
            console.error(e);
            setErrorMsg(e.message);
        } finally {
            setIsSubmittingSirReview(false);
        }
    };

    const renderOutputData = (jsonData) => {
        try {
            if (!jsonData) return "No output data.";
            if (activeAgentId === 1) {
                if (Array.isArray(jsonData.topicOpportunities)) {
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                            {jsonData.confidenceNotes && (
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                    {jsonData.confidenceNotes}
                                </div>
                            )}
                            {jsonData.topicOpportunities.map((t, idx) => {
                                const isTargetSelected = fullProject?.WorkingTitle && fullProject.WorkingTitle.trim() === t.topicIdea?.trim();
                                return (
                                    <div key={t.id || idx} style={{
                                        background: isTargetSelected ? 'rgba(52, 211, 153, 0.1)' : 'rgba(0,0,0,0.2)',
                                        border: isTargetSelected ? '2px solid #34d399' : '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '12px', padding: '1.2rem', transition: 'all 0.2s', position: 'relative'
                                    }}>
                                        <div style={{ position: 'absolute', top: '-10px', left: '-10px', background: isTargetSelected ? '#34d399' : '#3f3f46', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', color: isTargetSelected ? '#000' : '#fff', border: '2px solid #18181b', zIndex: 2 }}>
                                            {idx + 1}
                                        </div>
                                        <h3 style={{ margin: '0 0 0.8rem 0', fontSize: '1.1rem', color: '#f4f4f5' }}>{t.topicIdea}</h3>
                                        <div style={{ fontSize: '0.85rem', color: '#d4d4d8', marginBottom: '0.8rem', lineHeight: '1.5' }}>
                                            <b style={{ color: '#a1a1aa' }}>Why It Works:</b> {t.whyItWorks}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#d4d4d8', marginBottom: '1.2rem', lineHeight: '1.5' }}>
                                            <b style={{ color: '#a1a1aa' }}>Target Audience:</b> {t.targetAudience}
                                        </div>

                                        {fullProject.ResearchBehavior === 'suggest_topics' && !isTargetSelected && (
                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => handleSelectTopic(t.topicIdea)}
                                                    style={{
                                                        background: '#34d399', color: '#000', border: 'none', padding: '0.6rem 1.2rem',
                                                        borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: '0.2s'
                                                    }}>
                                                    Select this Subject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                }

                const ListSection = ({ title, items, color = '#a1a1aa' }) => {
                    if (!items || !items.length) return null;
                    return (
                        <div style={{ marginBottom: '1.2rem' }}>
                            <b style={{ color, textTransform: 'uppercase', fontSize: '0.75rem' }}>{title}</b>
                            <ul style={{ margin: '0.4rem 0 0 0', paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#d4d4d8' }}>
                                {items.map((it, i) => <li key={i} style={{ marginBottom: '0.3rem' }}>{String(it)}</li>)}
                            </ul>
                        </div>
                    );
                };

                const pvStatuses = jsonData.providerStatuses || {};

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div>
                            {jsonData.topicSummary && <h4 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#f8fafc' }}>{jsonData.topicSummary}</h4>}
                            <div style={{ fontSize: '0.85rem' }}>
                                <b style={{ color: '#94a3b8' }}>Intent:</b> {jsonData.likelySearchIntent || 'Unknown'} | <b style={{ color: '#94a3b8' }}>Browse Potential:</b> {jsonData.likelyBrowsePotential || 'Unknown'}
                            </div>
                        </div>

                        {jsonData.youtubeInsights && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.8rem' }}>YOUTUBE INSIGHTS</div>
                                <ListSection title="Competitor Patterns" items={jsonData.youtubeInsights.competitorPatterns} color="#fca5a5" />
                                <ListSection title="Recurring Themes" items={jsonData.youtubeInsights.recurringThemes} color="#fca5a5" />
                                <ListSection title="Performance Signals" items={jsonData.youtubeInsights.observablePerformanceSignals} color="#fca5a5" />
                                <ListSection title="Opportunities" items={jsonData.youtubeInsights.opportunities} color="#fca5a5" />
                            </div>
                        )}

                        {jsonData.youtubePackaging && (
                            <div style={{ background: 'rgba(217, 70, 239, 0.05)', border: '1px solid rgba(217, 70, 239, 0.2)', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#d946ef', marginBottom: '0.8rem' }}>YOUTUBE PACKAGING</div>
                                <ListSection title="Winning Titles" items={jsonData.youtubePackaging.winningTitles} color="#f0abfc" />
                                <ListSection title="Thumbnail Patterns" items={jsonData.youtubePackaging.thumbnailPatterns} color="#f0abfc" />
                                <ListSection title="Hook Patterns" items={jsonData.youtubePackaging.hookPatterns} color="#f0abfc" />
                                <ListSection title="Video Format Patterns" items={jsonData.youtubePackaging.videoFormatPatterns} color="#f0abfc" />
                            </div>
                        )}

                        {jsonData.searchInsights && (
                            <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3b82f6', marginBottom: '0.8rem' }}>SEARCH INSIGHTS</div>
                                <ListSection title="Query Patterns" items={jsonData.searchInsights.queryPatterns} color="#93c5fd" />
                                <ListSection title="Comparison Queries" items={jsonData.searchInsights.comparisonQueries} color="#93c5fd" />
                                <ListSection title="Problem Queries" items={jsonData.searchInsights.problemQueries} color="#93c5fd" />
                                <ListSection title="Decision Questions" items={jsonData.searchInsights.decisionQuestions} color="#93c5fd" />
                            </div>
                        )}

                        {jsonData.communityInsights && (
                            <div style={{ background: 'rgba(249, 115, 22, 0.05)', border: '1px solid rgba(249, 115, 22, 0.2)', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f97316', marginBottom: '0.8rem' }}>COMMUNITY INSIGHTS</div>
                                <ListSection title="Pain Points" items={jsonData.communityInsights.painPoints} color="#fdba74" />
                                <ListSection title="Objections" items={jsonData.communityInsights.objections} color="#fdba74" />
                                <ListSection title="Language Used" items={jsonData.communityInsights.languageUsed} color="#fdba74" />
                            </div>
                        )}

                        {jsonData.businessFit && (
                            <div style={{ background: 'rgba(14, 165, 233, 0.05)', border: '1px solid rgba(14, 165, 233, 0.2)', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0ea5e9', marginBottom: '0.8rem' }}>BUSINESS FIT</div>
                                <div style={{ fontSize: '0.85rem', color: '#e0f2fe', marginBottom: '0.4rem' }}>
                                    <b style={{ color: '#7dd3fc' }}>Purchase Intent:</b> {jsonData.businessFit.purchaseIntentLevel || 'Unspecified'}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#e0f2fe', marginBottom: '0.4rem' }}>
                                    <b style={{ color: '#7dd3fc' }}>Audience Stage:</b> {jsonData.businessFit.audienceStage || 'Unspecified'}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#e0f2fe', marginBottom: '0.4rem' }}>
                                    <b style={{ color: '#7dd3fc' }}>Consultation Potential:</b> {jsonData.businessFit.consultationPotential || 'Unspecified'}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#e0f2fe' }}>
                                    <b style={{ color: '#7dd3fc' }}>CTA Direction:</b> {jsonData.businessFit.recommendedCtaDirection || 'Unspecified'}
                                </div>
                            </div>
                        )}

                        <ListSection title="Audience Questions" items={jsonData.audienceQuestions} color="#a1a1aa" />
                        <ListSection title="Content Gaps" items={jsonData.contentGaps} color="#34d399" />
                        <ListSection title="Risks / Weaknesses" items={jsonData.risksOrWeaknesses} color="#ef4444" />

                        {jsonData.evidence && (
                            <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', marginBottom: '0.8rem' }}>EVIDENCE & CLAIMS</div>
                                <ListSection title="Safe Claims" items={jsonData.evidence.safeClaims || jsonData.evidence.supportedFacts} color="#6ee7b7" />
                                <ListSection title="Requires Verification" items={jsonData.evidence.claimsRequiringVerification || jsonData.evidence.claimsNeedingVerification} color="#fde047" />
                                <ListSection title="Claims To Avoid" items={jsonData.evidence.claimsToAvoid} color="#f87171" />
                            </div>
                        )}

                        {(jsonData.youtubeContentOpportunity || jsonData.recommendedResearchOpportunity || jsonData.recommendedResearchAngle) && (
                            <div style={{ background: 'rgba(129, 140, 248, 0.1)', border: '1px solid rgba(129, 140, 248, 0.3)', padding: '1rem', borderRadius: '8px' }}>
                                <b style={{ color: '#818cf8', fontSize: '0.8rem', textTransform: 'uppercase' }}>YouTube Content Opportunity</b>
                                <div style={{ marginTop: '0.5rem', color: '#e4e4e7', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                    {jsonData.youtubeContentOpportunity || jsonData.recommendedResearchOpportunity || jsonData.recommendedResearchAngle}
                                </div>
                            </div>
                        )}

                        {jsonData.confidenceNotes && (
                            <div style={{ fontSize: '0.85rem', color: '#a1a1aa', fontStyle: 'italic', padding: '0.5rem 0' }}>
                                {jsonData.confidenceNotes}
                            </div>
                        )}

                        <ListSection title="Sources Used" items={jsonData.sources || jsonData.sourceContextUsed} color="#94a3b8" />

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Provider Status</div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                {['YouTube', 'Search', 'Reddit (Direct API)', 'Community Search', 'Evidence'].map(prov => {
                                    const st = pvStatuses[prov] || 'Unknown';
                                    let icon = '⏸️'; let color = '#a1a1aa';
                                    if (st === 'success') { icon = '✓'; color = '#34d399'; }
                                    else if (st === 'failed' || st === 'timeout') { icon = '❌'; color = '#ef4444'; }
                                    else if (st === 'partial') { icon = '⚠️'; color = '#fbbf24'; }
                                    else if (st === 'not_configured' || st === 'oauth_required') { icon = '⚙️'; color = '#94a3b8'; }

                                    // Custom label display
                                    let label = prov;
                                    if (prov === 'Reddit (Direct API)' && st === 'oauth_required') {
                                        label = 'Direct Reddit API';
                                    } else if (prov === 'Community Search') {
                                        label = 'Community Research';
                                    }

                                    return (
                                        <div key={prov} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color }}>
                                            <span>{icon}</span> {label} ({st.replace('_', ' ')})
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            }
            if (activeAgentId === 2) {
                const recSet = new Set();
                if (jsonData.recommendedAngles) jsonData.recommendedAngles.forEach(r => recSet.add(r));
                if (jsonData.recommendedAngle) recSet.add(jsonData.recommendedAngle);
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                        {Array.isArray(jsonData.angles) && jsonData.angles.map((a, idx) => {
                            const isSelected = selectedAngleId === a.id;
                            const isRecommended = recSet.has(a.id);
                            return (
                                <div key={a.id || idx} style={{
                                    background: 'rgba(0,0,0,0.2)',
                                    border: isSelected ? '2px solid #a855f7' : '1px solid rgba(255,255,255,0.08)',
                                    boxShadow: isSelected ? '0 0 20px rgba(168,85,247,0.15)' : 'none',
                                    borderRadius: '12px', padding: '1.2rem', transition: 'all 0.2s', position: 'relative'
                                }}>
                                    {/* Number Badge */}
                                    <div style={{ position: 'absolute', top: '-10px', left: '-10px', background: isSelected ? '#a855f7' : '#3f3f46', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', color: '#fff', border: '2px solid #18181b', zIndex: 2 }}>
                                        {idx + 1}
                                    </div>

                                    {/* Header Section */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem', paddingLeft: '0.8rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: isSelected ? '#d8b4fe' : '#f4f4f5' }}>{a.angleTitle || a.title}</h3>
                                                {isRecommended && <span style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#fde047', border: '1px solid rgba(234, 179, 8, 0.3)', fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '12px', textTransform: 'uppercase', fontWeight: 700 }}>Recommended</span>}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{a.coreConcept || a.approach}</div>
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '0.85rem', color: '#d4d4d8', marginBottom: '1rem', lineHeight: '1.5' }}>
                                        <b style={{ color: '#a1a1aa' }}>Viewer Promise:</b> {a.viewerPromise || a.description}
                                    </div>

                                    <div style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ marginBottom: '0.6rem' }}><b style={{ color: '#a1a1aa' }}>Why It Could Work:</b> <span style={{ color: '#e4e4e7' }}>{a.whyItWorks || a.whyItCouldWork}</span></div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.6rem' }}>
                                            <div><b style={{ color: '#a1a1aa' }}>Audience Pain Point:</b> <span style={{ color: '#e4e4e7' }}>{a.audiencePainPoint || 'N/A'}</span></div>
                                            <div><b style={{ color: '#a1a1aa' }}>Core Hook:</b> <span style={{ color: '#e4e4e7' }}>{a.hookExample || 'N/A'}</span></div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                                            <div><b style={{ color: '#a1a1aa' }}>Format:</b> <span style={{ color: '#e4e4e7' }}>{a.recommendedFormat || a.searchOrBrowse}</span></div>
                                            <div><b style={{ color: '#a1a1aa' }}>Business:</b> <span style={{ color: '#e4e4e7' }}>{a.businessIntent || a.evergreenOrTrending}</span></div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => setSelectedAngleId(a.id)}
                                            style={{
                                                width: '100%', padding: '0.6rem',
                                                background: isSelected ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.05)',
                                                color: isSelected ? '#d8b4fe' : '#e4e4e7',
                                                border: isSelected ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                transition: 'all 0.2s'
                                            }}>
                                            {isSelected ? <><span>✓</span> Selected</> : (selectedAngleId ? 'Change Selection' : `Select Angle ${idx + 1}`)}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            }
            if (activeAgentId === 3) {
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                        <div style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ marginBottom: '1.2rem' }}>
                                <b style={{ color: '#a1a1aa', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Primary Audience:</b>
                                <div style={{ color: '#e4e4e7', marginTop: '0.3rem', lineHeight: '1.5' }}>{jsonData.primaryAudience || 'Not provided'}</div>
                            </div>
                            <div style={{ marginBottom: '1.2rem' }}>
                                <b style={{ color: '#a1a1aa', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Viewer Intent:</b>
                                <div style={{ color: '#e4e4e7', marginTop: '0.3rem', lineHeight: '1.5' }}>{jsonData.viewerIntent || 'Not provided'}</div>
                            </div>

                            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.2rem', background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div><b style={{ color: '#a1a1aa', textTransform: 'uppercase', fontSize: '0.7rem' }}>Search vs Browse:</b> <span style={{ color: '#e4e4e7', display: 'block', marginTop: '0.2rem', fontWeight: 600 }}>{jsonData.searchVsBrowse || 'Not provided'}</span></div>
                                <div><b style={{ color: '#a1a1aa', textTransform: 'uppercase', fontSize: '0.7rem' }}>Evergreen vs Trending:</b> <span style={{ color: '#e4e4e7', display: 'block', marginTop: '0.2rem', fontWeight: 600 }}>{jsonData.evergreenVsTrending || 'Not provided'}</span></div>
                            </div>

                            <div style={{ marginBottom: '1.2rem' }}>
                                <b style={{ color: '#a1a1aa', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Video Promise:</b>
                                <div style={{ color: '#e4e4e7', marginTop: '0.3rem', lineHeight: '1.5' }}>{jsonData.videoPromise || 'Not provided'}</div>
                            </div>
                            <div style={{ marginBottom: '1.2rem' }}>
                                <b style={{ color: '#a1a1aa', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Positioning:</b>
                                <div style={{ color: '#e4e4e7', marginTop: '0.3rem', lineHeight: '1.5' }}>{jsonData.positioning || 'Not provided'}</div>
                            </div>
                            <div style={{ marginBottom: '1.2rem' }}>
                                <b style={{ color: '#a1a1aa', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Series Potential:</b>
                                <div style={{ color: '#e4e4e7', marginTop: '0.3rem', lineHeight: '1.5' }}>{jsonData.seriesPotential || 'Not provided'}</div>
                            </div>
                            <div style={{ marginBottom: '1.2rem' }}>
                                <b style={{ color: '#a1a1aa', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Publishing Strategy:</b>
                                <div style={{ color: '#e4e4e7', marginTop: '0.3rem', lineHeight: '1.5' }}>{jsonData.publishingStrategy || 'Not provided'}</div>
                            </div>

                            {jsonData.risks && (
                                <div style={{ marginBottom: '1.2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
                                    <b style={{ color: '#ef4444', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Risks:</b>
                                    {Array.isArray(jsonData.risks) ? (
                                        <ul style={{ margin: '0.4rem 0 0 0', paddingLeft: '1.2rem', color: '#e4e4e7', lineHeight: '1.5' }}>
                                            {jsonData.risks.map((r, i) => <li key={i}>{String(r)}</li>)}
                                        </ul>
                                    ) : (
                                        <div style={{ color: '#e4e4e7', marginTop: '0.3rem', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{jsonData.risks}</div>
                                    )}
                                </div>
                            )}

                            {jsonData.successCriteria && (
                                <div style={{ marginBottom: '0.2rem', padding: '1rem', background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '8px' }}>
                                    <b style={{ color: '#10b981', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Success Criteria:</b>
                                    {Array.isArray(jsonData.successCriteria) ? (
                                        <ul style={{ margin: '0.4rem 0 0 0', paddingLeft: '1.2rem', color: '#e4e4e7', lineHeight: '1.5' }}>
                                            {jsonData.successCriteria.map((r, i) => <li key={i}>{String(r)}</li>)}
                                        </ul>
                                    ) : (
                                        <div style={{ color: '#e4e4e7', marginTop: '0.3rem', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{jsonData.successCriteria}</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            }

            if (activeAgentId === 4) {
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                        <div style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>

                            <div style={{ marginBottom: '1.2rem' }}>
                                <b style={{ color: '#a1a1aa', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Opening Promise:</b>
                                <div style={{ color: '#e4e4e7', marginTop: '0.3rem', lineHeight: '1.5' }}>{jsonData.openingPromise || 'Not provided'}</div>
                            </div>

                            <div style={{ marginBottom: '1.2rem' }}>
                                <b style={{ color: '#a1a1aa', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Hook Strategy:</b>
                                <div style={{ color: '#e4e4e7', marginTop: '0.3rem', lineHeight: '1.5' }}>{jsonData.hookStrategy || 'Not provided'}</div>
                            </div>

                            <div style={{ marginBottom: '1.2rem' }}>
                                <b style={{ color: '#a1a1aa', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Story Arc:</b>
                                <div style={{ color: '#e4e4e7', marginTop: '0.3rem', lineHeight: '1.5' }}>{jsonData.storyArc || 'Not provided'}</div>
                            </div>

                            <div style={{ marginBottom: '1.2rem' }}>
                                <b style={{ color: '#a1a1aa', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Curiosity Loops:</b>
                                {Array.isArray(jsonData.curiosityLoops) ? (
                                    <ul style={{ margin: '0.4rem 0 0 0', paddingLeft: '1.2rem', color: '#e4e4e7', lineHeight: '1.5' }}>
                                        {jsonData.curiosityLoops.map((r, i) => <li key={i}>{String(r)}</li>)}
                                    </ul>
                                ) : (
                                    <div style={{ color: '#e4e4e7', marginTop: '0.3rem', lineHeight: '1.5' }}>{jsonData.curiosityLoops}</div>
                                )}
                            </div>

                            <div style={{ marginBottom: '1.2rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <b style={{ color: '#a1a1aa', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', display: 'block', marginBottom: '0.8rem' }}>Chapter Flow:</b>
                                {Array.isArray(jsonData.chapterFlow) ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {jsonData.chapterFlow.map((ch, i) => (
                                            <div key={i} style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', borderLeft: '3px solid #60a5fa' }}>
                                                <div style={{ fontWeight: 600, color: '#60a5fa', marginBottom: '0.3rem' }}>Chapter {ch.chapterNumber || i + 1}: {ch.chapterTitle}</div>
                                                <div style={{ color: '#a1a1aa', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{ch.purpose}</div>
                                                <ul style={{ margin: '0', paddingLeft: '1.2rem', color: '#e4e4e7', fontSize: '0.8rem' }}>
                                                    {Array.isArray(ch.keyPoints) ? ch.keyPoints.map((kp, j) => <li key={j}>{kp}</li>) : null}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ color: '#e4e4e7' }}>No chapters parsed</div>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                                <div>
                                    <b style={{ color: '#a1a1aa', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Mid-Video Rehooks:</b>
                                    {Array.isArray(jsonData.midVideoRehooks) ? (
                                        <ul style={{ margin: '0.4rem 0 0 0', paddingLeft: '1.2rem', color: '#e4e4e7', fontSize: '0.8rem' }}>
                                            {jsonData.midVideoRehooks.map((r, i) => <li key={i}>{String(r)}</li>)}
                                        </ul>
                                    ) : (
                                        <div style={{ color: '#e4e4e7', marginTop: '0.3rem', fontSize: '0.8rem' }}>{jsonData.midVideoRehooks}</div>
                                    )}
                                </div>
                                <div>
                                    <b style={{ color: '#a1a1aa', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Pacing Notes:</b>
                                    <div style={{ color: '#e4e4e7', marginTop: '0.4rem', fontSize: '0.8rem', lineHeight: '1.5' }}>{jsonData.pacingNotes}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.2rem', background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div><b style={{ color: '#a1a1aa', textTransform: 'uppercase', fontSize: '0.7rem' }}>Expected Length:</b> <span style={{ color: '#e4e4e7', display: 'block', marginTop: '0.2rem', fontWeight: 600 }}>{jsonData.expectedVideoLength || '?'}</span></div>
                                <div><b style={{ color: '#a1a1aa', textTransform: 'uppercase', fontSize: '0.7rem' }}>CTA Placement:</b> <span style={{ color: '#e4e4e7', display: 'block', marginTop: '0.2rem', fontWeight: 600 }}>{jsonData.ctaPlacement || '?'}</span></div>
                            </div>

                            <div style={{ marginBottom: '1.2rem' }}>
                                <b style={{ color: '#a1a1aa', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Ending Strategy:</b>
                                <div style={{ color: '#e4e4e7', marginTop: '0.3rem', lineHeight: '1.5' }}>{jsonData.endingStrategy || 'Not provided'}</div>
                            </div>

                            {Array.isArray(jsonData.structureWarnings) && jsonData.structureWarnings.length > 0 && (
                                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
                                    <b style={{ color: '#ef4444', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Structure Warnings:</b>
                                    <ul style={{ margin: '0.4rem 0 0 0', paddingLeft: '1.2rem', color: '#e4e4e7', lineHeight: '1.5', fontSize: '0.85rem' }}>
                                        {jsonData.structureWarnings.map((r, i) => <li key={i}>{String(r)}</li>)}
                                    </ul>
                                </div>
                            )}

                        </div>
                    </div>
                );
            }
            if (activeAgentId === 5) {
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: '1.6', color: '#e4e4e7' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                            <h2 style={{ color: '#fff', margin: '0 0 0.5rem 0' }}>{jsonData.scriptTitle}</h2>
                            <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                                Estimated Word Count: {jsonData.estimatedWordCount || '?'} • Duration: {jsonData.estimatedDurationMinutes || '?'} mins
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '1px' }}>Opening</div>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{jsonData.opening}</div>
                        </div>

                        {Array.isArray(jsonData.chapters) && jsonData.chapters.map((ch, i) => (
                            <React.Fragment key={'ch-' + i}>
                                {jsonData.transitions && jsonData.transitions[i - 1] && (
                                    <div style={{ fontStyle: 'italic', color: '#a1a1aa', padding: '0.8rem 1.2rem', background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid #60a5fa', margin: '0.5rem 0' }}>
                                        <b style={{ textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', marginBottom: '0.2rem' }}>Transition</b>
                                        {jsonData.transitions[i - 1]}
                                    </div>
                                )}
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '1px' }}>Chapter {i + 1} — {ch.chapterTitle}</div>
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{ch.scriptText}</div>
                                </div>
                                {jsonData.rehooks && jsonData.rehooks[i] && (
                                    <div style={{ fontStyle: 'italic', color: '#fbbf24', padding: '0.8rem 1.2rem', background: 'rgba(251,191,36,0.05)', borderLeft: '3px solid #fbbf24', margin: '0.5rem 0' }}>
                                        <b style={{ textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', marginBottom: '0.2rem' }}>Rehook</b>
                                        {jsonData.rehooks[i]}
                                    </div>
                                )}
                            </React.Fragment>
                        ))}

                        {jsonData.cta && (
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#f472b6', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '1px' }}>Call To Action</div>
                                <div style={{ whiteSpace: 'pre-wrap' }}>{jsonData.cta}</div>
                            </div>
                        )}

                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '1px' }}>Ending</div>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{jsonData.ending}</div>
                        </div>
                    </div>
                );
            }
            if (activeAgentId === 6) {
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: '1.6', color: '#e4e4e7' }}>
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid #8b5cf6' }}>
                            <b style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', color: '#a1a1aa', display: 'block', marginBottom: '0.5rem' }}>Production Notes:</b>
                            {jsonData.productionNotes ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                                    <div><span style={{ color: '#a1a1aa' }}>Camera Style:</span> {jsonData.productionNotes.cameraStyle}</div>
                                    <div><span style={{ color: '#a1a1aa' }}>Editing Style:</span> {jsonData.productionNotes.editingStyle}</div>
                                    <div><span style={{ color: '#a1a1aa' }}>Visual Tone:</span> {jsonData.productionNotes.visualTone}</div>
                                    <div><span style={{ color: '#a1a1aa' }}>Props:</span> {Array.isArray(jsonData.productionNotes.propsRequired) ? jsonData.productionNotes.propsRequired.join(', ') : 'None'}</div>
                                </div>
                            ) : (
                                <div>No production notes provided.</div>
                            )}
                        </div>

                        {Array.isArray(jsonData.chapters) && jsonData.chapters.map((ch, i) => (
                            <div key={'ch-' + i} style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.3rem', letterSpacing: '1px' }}>Chapter {i + 1} — {ch.chapter}</div>
                                <div style={{ fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '0.8rem', fontStyle: 'italic' }}>Goal: {ch.visualGoal}</div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8rem' }}>
                                    {Array.isArray(ch.shots) && ch.shots.length > 0 && (
                                        <div>
                                            <div style={{ color: '#60a5fa', fontWeight: 600, marginBottom: '0.2rem' }}>Shots</div>
                                            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#cbd5e1' }}>
                                                {ch.shots.map((s, idx) => <li key={idx}>{s}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {Array.isArray(ch.bRoll) && ch.bRoll.length > 0 && (
                                        <div>
                                            <div style={{ color: '#60a5fa', fontWeight: 600, marginBottom: '0.2rem' }}>B-Roll</div>
                                            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#cbd5e1' }}>
                                                {ch.bRoll.map((b, idx) => <li key={idx}>{b}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {Array.isArray(ch.graphics) && ch.graphics.length > 0 && (
                                        <div>
                                            <div style={{ color: '#a855f7', fontWeight: 600, marginBottom: '0.2rem' }}>Graphics</div>
                                            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#cbd5e1' }}>
                                                {ch.graphics.map((g, idx) => <li key={idx}>{g}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {Array.isArray(ch.demonstrations) && ch.demonstrations.length > 0 && (
                                        <div>
                                            <div style={{ color: '#a855f7', fontWeight: 600, marginBottom: '0.2rem' }}>Demonstrations</div>
                                            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#cbd5e1' }}>
                                                {ch.demonstrations.map((d, idx) => <li key={idx}>{d}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            }

            if (activeAgentId === 7) {
                const recSet = new Set();
                if (jsonData.recommendedConceptId) recSet.add(jsonData.recommendedConceptId);
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                        {Array.isArray(jsonData.thumbnailConcepts) && jsonData.thumbnailConcepts.map((c, idx) => {
                            const isSelected = selectedAngleId === c.id;
                            const isRecommended = recSet.has(c.id);
                            return (
                                <div key={c.id || idx} style={{
                                    background: 'rgba(0,0,0,0.2)',
                                    border: isSelected ? '2px solid #a855f7' : '1px solid rgba(255,255,255,0.08)',
                                    boxShadow: isSelected ? '0 0 20px rgba(168,85,247,0.15)' : 'none',
                                    borderRadius: '12px', padding: '1.2rem', transition: 'all 0.2s', position: 'relative'
                                }}>
                                    <div style={{ position: 'absolute', top: '-10px', left: '-10px', background: isSelected ? '#a855f7' : '#3f3f46', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', color: '#fff', border: '2px solid #18181b', zIndex: 2 }}>{idx + 1}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem', paddingLeft: '0.8rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: isSelected ? '#d8b4fe' : '#f4f4f5' }}>{c.conceptName}</h3>
                                                {isRecommended && <span style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#fde047', border: '1px solid rgba(234, 179, 8, 0.3)', fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '12px', textTransform: 'uppercase', fontWeight: 700 }}>Recommended</span>}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.coreIdea}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#d4d4d8', marginBottom: '1rem', lineHeight: '1.5' }}>
                                        <div style={{ marginBottom: '0.4rem' }}><b style={{ color: '#a1a1aa' }}>Thumbnail Copy:</b> {c.thumbnailCopy || 'None'}</div>
                                        <div style={{ marginBottom: '0.4rem' }}><b style={{ color: '#a1a1aa' }}>Main Visual:</b> {c.mainVisual}</div>
                                        <div style={{ marginBottom: '0.4rem' }}><b style={{ color: '#a1a1aa' }}>Emotional Trigger:</b> {c.emotionalTrigger}</div>
                                        <div style={{ marginBottom: '0.4rem' }}><b style={{ color: '#a1a1aa' }}>Curiosity Gap:</b> {c.curiosityGap}</div>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ marginBottom: '0.6rem' }}><b style={{ color: '#a1a1aa' }}>Why It Could Work:</b> <span style={{ color: '#e4e4e7' }}>{c.whyItCouldWork}</span></div>
                                        <div><b style={{ color: '#a1a1aa' }}>Risk Parameter:</b> <span style={{ color: '#e4e4e7' }}>{c.risk}</span></div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setSelectedAngleId(c.id)} style={{ width: '100%', padding: '0.6rem', background: isSelected ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.05)', color: isSelected ? '#d8b4fe' : '#e4e4e7', border: isSelected ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
                                            {isSelected ? <><span>✓</span> Selected Concept</> : (selectedAngleId ? 'Change Selection' : `Select Concept ${idx + 1}`)}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            }
            if (activeAgentId === 8) {
                const design = jsonData.thumbnailDesign;
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: '1.6', color: '#e4e4e7' }}>
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid #8b5cf6' }}>
                            <b style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', color: '#a1a1aa', display: 'block', marginBottom: '0.5rem' }}>Design Directives:</b>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem', fontSize: '0.85rem' }}>
                                <div><b style={{ color: '#d8b4fe' }}>Layout:</b> {design?.layout}</div>
                                <div><b style={{ color: '#d8b4fe' }}>Composition:</b> {design?.composition}</div>
                                <div><b style={{ color: '#d8b4fe' }}>Subject Placement:</b> {design?.subjectPlacement}</div>
                                <div><b style={{ color: '#d8b4fe' }}>Background:</b> {design?.background}</div>
                                <div><b style={{ color: '#d8b4fe' }}>Typography:</b> {design?.typography}</div>
                                <div><b style={{ color: '#d8b4fe' }}>Thumbnail Text:</b> {design?.thumbnailText}</div>
                                <div><b style={{ color: '#34d399' }}>Color Direction:</b> {design?.colorDirection}</div>
                                <div><b style={{ color: '#34d399' }}>Visual Hierarchy:</b> {design?.visualHierarchy}</div>
                            </div>
                        </div>
                        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <b style={{ color: '#34d399', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>Editing Instructions</b>
                            <div>{design?.editingInstructions}</div>
                        </div>
                        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <b style={{ color: '#34d399', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>AI Image Prompt (Midjourney/DALL-E)</b>
                            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.8rem', margin: 0, color: '#fbbf24' }}>{design?.aiImagePrompt}</pre>
                        </div>
                        <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <b style={{ color: '#60a5fa', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>Production Notes / Execution</b>
                            <div>{jsonData.productionNotes}</div>
                            <div style={{ marginTop: '0.5rem', fontStyle: 'italic', fontSize: '0.8rem' }}>{jsonData.recommendedExecution}</div>
                        </div>
                    </div>
                );
            }

            if (activeAgentId === 9) {
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                        {Array.isArray(jsonData.titles) && jsonData.titles.map((t, idx) => {
                            const isSelected = selectedAngleId === t.id;
                            const isRecommended = jsonData.recommendedTitleId === t.id;
                            return (
                                <div key={t.id || idx} style={{ background: 'rgba(0,0,0,0.2)', border: isSelected ? '2px solid #a855f7' : '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.2rem', transition: 'all 0.2s', boxShadow: isSelected ? '0 0 20px rgba(168,85,247,0.15)' : 'none' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: isSelected ? '#d8b4fe' : '#f4f4f5' }}>{t.title}</h3>
                                                {isRecommended && <span style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#fde047', border: '1px solid rgba(234, 179, 8, 0.3)', fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '12px', textTransform: 'uppercase', fontWeight: 700 }}>Recommended</span>}
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.7rem', color: '#a855f7', background: 'rgba(168,85,247,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{t.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#d4d4d8', marginBottom: '1rem' }}>
                                        <div style={{ marginBottom: '0.4rem' }}><b style={{ color: '#34d399' }}>CTR Reason:</b> {t.ctrReason}</div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setSelectedAngleId(t.id)} style={{ padding: '0.4rem 1rem', background: isSelected ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)', color: isSelected ? '#d8b4fe' : '#e4e4e7', border: isSelected ? '1px solid rgba(168,85,247,0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 }}>
                                            {isSelected ? '✓ Selected' : 'Select Title'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            }

            if (activeAgentId === 10) {
                const seo = jsonData.seoPackage;
                const renderAsset = (asset) => {
                    if (!asset) return 'None';
                    if (typeof asset === 'string') return asset;
                    if (asset.type === 'future_content_opportunity') return <span style={{ color: '#fcd34d', fontStyle: 'italic' }}>💡 {asset.suggestion}</span>;
                    return JSON.stringify(asset);
                };

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: '1.6', color: '#e4e4e7' }}>
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid #8b5cf6' }}>
                            <b style={{ color: '#a855f7', display: 'block', marginBottom: '0.3rem' }}>Keywords</b>
                            <div><b style={{ color: '#a1a1aa' }}>Primary:</b> <span style={{ color: '#fff', fontWeight: 600 }}>{seo?.primaryKeyword}</span></div>
                            <div style={{ marginTop: '0.5rem' }}><b style={{ color: '#a1a1aa' }}>Secondary:</b> {Array.isArray(seo?.secondaryKeywords) ? seo.secondaryKeywords.map(k => <span key={k} style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)', margin: '0.2rem', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>{k}</span>) : 'None'}</div>
                        </div>
                        <div style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <b style={{ color: '#34d399', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', display: 'block', marginBottom: '0.8rem' }}>Description</b>
                            <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{seo?.description}</div>
                        </div>
                        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <b style={{ color: '#60a5fa', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>Chapters</b>
                            <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.85rem' }}>
                                {Array.isArray(seo?.chapters) && seo.chapters.map((ch, idx) => (
                                    <li key={idx} style={{ marginBottom: '0.3rem' }}><b style={{ color: '#60a5fa' }}>{ch.timestamp}</b> - {ch.title}</li>
                                ))}
                            </ul>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <b style={{ color: '#f472b6', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>Tags & Hashtags</b>
                                <div style={{ marginBottom: '0.8rem' }}><b style={{ color: '#a1a1aa', display: 'block', marginBottom: '0.3rem' }}>Tags:</b> <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{Array.isArray(seo?.tags) ? seo.tags.join(', ') : 'None'}</div></div>
                                <div><b style={{ color: '#a1a1aa', display: 'block', marginBottom: '0.3rem' }}>Hashtags:</b> <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{Array.isArray(seo?.hashtags) ? seo.hashtags.join(' ') : 'None'}</div></div>
                            </div>
                            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                                <b style={{ color: '#a855f7', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>Advanced Setup</b>
                                <div style={{ marginBottom: '0.8rem' }}><b style={{ color: '#a1a1aa' }}>Playlist:</b> {renderAsset(seo?.playlistSuggestion)}</div>
                                <div style={{ marginBottom: '0.8rem' }}><b style={{ color: '#a1a1aa' }}>Pinned Comment:</b> {seo?.pinnedComment}</div>
                                <div style={{ marginBottom: '0.8rem' }}><b style={{ color: '#a1a1aa' }}>End Screen:</b> {renderAsset(seo?.endScreenSuggestion)}</div>
                                <div><b style={{ color: '#a1a1aa' }}>Cards:</b> {renderAsset(seo?.cardsSuggestion)}</div>
                            </div>
                        </div>
                    </div>
                );
            }

            if (activeAgentId === 10.5) {
                const meta = jsonData.uploadMetadata || jsonData.metadataPackage?.uploadMetadata || {};
                const search = jsonData.searchOptimization || jsonData.metadataPackage?.searchOptimization || {};
                const pub = jsonData.publishingRecommendations || jsonData.metadataPackage?.publishingRecommendations || {};
                const brand = jsonData.brandSafetyCheck || jsonData.metadataPackage?.brandSafetyCheck || {};

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: '1.6', color: '#e4e4e7' }}>
                        {/* Title & Description */}
                        <div style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <b style={{ color: '#34d399', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', display: 'block', marginBottom: '0.8rem' }}>Optimized Title</b>
                            <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 600, marginBottom: '1.5rem' }}>{meta.title}</div>

                            <b style={{ color: '#34d399', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', display: 'block', marginBottom: '0.8rem' }}>YouTube Description Package</b>
                            <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{meta.description}</div>
                        </div>

                        {/* Search & Organization */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid #60a5fa' }}>
                                <b style={{ color: '#60a5fa', display: 'block', marginBottom: '0.5rem' }}>Search Optimization</b>
                                <div><b style={{ color: '#a1a1aa' }}>Primary Target:</b> <span style={{ color: '#fff' }}>{search.primaryKeyword}</span></div>
                                <div style={{ marginTop: '0.5rem' }}><b style={{ color: '#a1a1aa' }}>Secondary:</b> {Array.isArray(search.secondaryKeywords) ? search.secondaryKeywords.join(', ') : 'None'}</div>
                                <div style={{ marginTop: '0.5rem' }}><b style={{ color: '#a1a1aa' }}>FAQ Match:</b> {Array.isArray(search.faqKeywords) ? search.faqKeywords.join(', ') : 'None'}</div>
                            </div>

                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid #f472b6' }}>
                                <b style={{ color: '#f472b6', display: 'block', marginBottom: '0.5rem' }}>Publishing Tags</b>
                                <div><b style={{ color: '#a1a1aa' }}>Tags:</b> {Array.isArray(meta.tags) ? meta.tags.join(', ') : 'None'}</div>
                                <div style={{ marginTop: '0.5rem' }}><b style={{ color: '#a1a1aa' }}>Hashtags:</b> {Array.isArray(meta.hashtags) ? meta.hashtags.join(' ') : 'None'}</div>
                                <div style={{ marginTop: '0.5rem' }}><b style={{ color: '#a1a1aa' }}>Category:</b> {meta.category}</div>
                            </div>
                        </div>

                        {/* Chapters */}
                        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <b style={{ color: '#a855f7', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>Timestamps / Chapters</b>
                            <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.85rem' }}>
                                {Array.isArray(meta.chapters) && meta.chapters.map((ch, idx) => (
                                    <li key={idx} style={{ marginBottom: '0.3rem' }}>{ch}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Recommendations & Brand Safety */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                                <b style={{ color: '#fbbf24', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>Publishing Recommendations</b>
                                <div style={{ marginBottom: '0.6rem' }}><b style={{ color: '#a1a1aa' }}>End Screen:</b> {pub.endScreenSuggestion}</div>
                                <div style={{ marginBottom: '0.6rem' }}><b style={{ color: '#a1a1aa' }}>Playlist Target:</b> {pub.playlistRecommendation || meta.playlistSuggestion}</div>
                                <div style={{ marginBottom: '0.6rem' }}><b style={{ color: '#a1a1aa' }}>Related Videos:</b> {Array.isArray(pub.relatedVideos) ? pub.relatedVideos.join(', ') : 'None'}</div>
                                <div><b style={{ color: '#a1a1aa' }}>Card Layout:</b> {Array.isArray(pub.cardPlacement) ? pub.cardPlacement.join(', ') : 'None'}</div>
                            </div>

                            <div style={{ padding: '1rem', background: brand.premiumEducationalToneMaintained ? 'rgba(52, 211, 153, 0.05)' : 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: brand.premiumEducationalToneMaintained ? '1px solid rgba(52, 211, 153, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.85rem' }}>
                                <b style={{ color: brand.premiumEducationalToneMaintained ? '#34d399' : '#ef4444', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', display: 'block', marginBottom: '0.8rem' }}>Brand & Claims Safety</b>
                                <div><b style={{ color: '#a1a1aa' }}>Avoided Guarantees:</b> <span style={{ color: brand.guaranteedOutcomesAvoided ? '#34d399' : '#ef4444' }}>{brand.guaranteedOutcomesAvoided ? 'PASS' : 'FAIL'}</span></div>
                                <div style={{ marginTop: '0.4rem' }}><b style={{ color: '#a1a1aa' }}>Avoided Clickbait:</b> <span style={{ color: brand.misleadingTitlesAvoided ? '#34d399' : '#ef4444' }}>{brand.misleadingTitlesAvoided ? 'PASS' : 'FAIL'}</span></div>
                                <div style={{ marginTop: '0.4rem' }}><b style={{ color: '#a1a1aa' }}>Tone Match:</b> <span style={{ color: brand.premiumEducationalToneMaintained ? '#34d399' : '#ef4444' }}>{brand.premiumEducationalToneMaintained ? 'PASS' : 'FAIL'}</span></div>
                                <div style={{ marginTop: '0.8rem', fontStyle: 'italic', color: '#cbd5e1' }}>{brand.analysis}</div>
                            </div>
                        </div>
                    </div>
                );
            }

            if (activeAgentId === 11) {
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: '1.6', color: '#e4e4e7' }}>
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid #8b5cf6' }}>
                            <b style={{ color: '#a855f7', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Overall Editing Style</b>
                            <div style={{ fontSize: '0.85rem' }}>{jsonData.editingStyle}</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <b style={{ color: '#34d399', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', marginBottom: '-0.5rem' }}>Timeline Plan</b>
                            {Array.isArray(jsonData.timelinePlan) && jsonData.timelinePlan.map((t, idx) => (
                                <div key={idx} style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <b style={{ color: '#60a5fa' }}>{t.timestamp} - {t.section}</b>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.85rem' }}>
                                        <div><b style={{ color: '#a1a1aa' }}>Action:</b> {t.editingAction}</div>
                                        <div><b style={{ color: '#a1a1aa' }}>Visuals:</b> {t.visualElements}</div>
                                        <div style={{ gridColumn: '1 / -1' }}><b style={{ color: '#a1a1aa' }}>Retention Purpose:</b> <span style={{ fontStyle: 'italic', color: '#cbd5e1' }}>{t.retentionPurpose}</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {jsonData.requiredAssets && (
                            <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <b style={{ color: '#ec4899', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', display: 'block', marginBottom: '0.8rem' }}>Required & Suggested Assets</b>
                                <div style={{ display: 'grid', gap: '0.8rem' }}>
                                    {jsonData.requiredAssets.map((asset, idx) => (
                                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, auto) 1fr auto', gap: '1rem', alignItems: 'center', fontSize: '0.85rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 0.8rem', borderRadius: '4px' }}>
                                            <b style={{ color: '#e4e4e7' }}>{asset.asset}</b>
                                            <span style={{ color: '#a1a1aa' }}>{asset.purpose}</span>
                                            <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: asset.availability === 'required' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: asset.availability === 'required' ? '#f43f5e' : '#60a5fa', textTransform: 'uppercase' }}>{asset.availability}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <b style={{ color: '#f472b6', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>B-Roll & Graphics</b>
                                <div style={{ marginBottom: '0.8rem' }}><b style={{ color: '#a1a1aa', display: 'block', marginBottom: '0.3rem' }}>Suggested B-Roll:</b> <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.8rem', color: '#cbd5e1' }}>{(jsonData.bRollSuggestions || []).map((b, i) => <li key={i}>{b}</li>)}</ul></div>
                                <div><b style={{ color: '#a1a1aa', display: 'block', marginBottom: '0.3rem' }}>Graphics Plan:</b> <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.8rem', color: '#cbd5e1' }}>{(jsonData.graphicsPlan || []).map((g, i) => <li key={i}>{g}</li>)}</ul></div>
                            </div>
                            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                                <b style={{ color: '#fbbf24', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>Sound & Transitions</b>
                                <div style={{ marginBottom: '0.6rem' }}><b style={{ color: '#a1a1aa' }}>Music:</b> {jsonData.soundDesign?.musicDirection}</div>
                                <div style={{ marginBottom: '0.6rem' }}><b style={{ color: '#a1a1aa' }}>SFX:</b> {jsonData.soundDesign?.soundEffects}</div>
                                <div style={{ marginBottom: '0.6rem' }}><b style={{ color: '#a1a1aa' }}>Voice:</b> {jsonData.soundDesign?.voiceTreatment}</div>
                                <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}><b style={{ color: '#a1a1aa', display: 'block' }}>Transitions:</b> {jsonData.transitionStrategy}</div>
                            </div>
                        </div>

                        <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <b style={{ color: '#60a5fa', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>Final Notes & Retention</b>
                            <ul style={{ margin: '0 0 0.8rem 0', paddingLeft: '1rem', fontSize: '0.85rem', color: '#e0f2fe' }}>
                                {(jsonData.retentionOptimizations || []).map((opt, i) => <li key={i}>{opt}</li>)}
                            </ul>
                            <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#bae6fd' }}>{jsonData.finalEditorNotes}</div>
                        </div>
                    </div>
                );
            }

            if (activeAgentId === 12) {
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: '1.6', color: '#e4e4e7' }}>
                        {/* Summary / Score Header */}
                        <div style={{ padding: '1.5rem', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', flexShrink: 0, border: '2px solid rgba(245, 158, 11, 0.4)' }}>
                                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24' }}>{jsonData.retentionScore}</span>
                            </div>
                            <div>
                                <b style={{ color: '#fbbf24', textTransform: 'uppercase', fontSize: '1rem', letterSpacing: '1px', display: 'block', marginBottom: '0.3rem' }}>Predicted Retention Score</b>
                                <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>This score represents the estimated audience retention percentage. A score below 70 indicates a high risk of viewer drop-off.</div>
                            </div>
                        </div>

                        {/* Opening Analysis */}
                        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <b style={{ color: '#818cf8', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Opening Analysis</b>
                            </div>
                            <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div><b style={{ color: '#34d399', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Strength</b> <div style={{ fontSize: '0.85rem' }}>{jsonData.openingAnalysis?.strength}</div></div>
                                <div><b style={{ color: '#f43f5e', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Weakness</b> <div style={{ fontSize: '0.85rem' }}>{jsonData.openingAnalysis?.weakness}</div></div>
                                <div><b style={{ color: '#a855f7', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Improvement</b> <div style={{ fontSize: '0.85rem' }}>{jsonData.openingAnalysis?.improvement}</div></div>
                            </div>
                        </div>

                        {/* Drop-off Predictions */}
                        {Array.isArray(jsonData.dropOffPredictions) && jsonData.dropOffPredictions.length > 0 && (
                            <div>
                                <b style={{ color: '#f87171', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', display: 'block', marginBottom: '0.8rem' }}>Predicted Drop-Off Points</b>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {jsonData.dropOffPredictions.map((drop, idx) => {
                                        const isHigh = String(drop.riskLevel).toUpperCase().includes('HIGH');
                                        return (
                                            <div key={idx} style={{ padding: '1.2rem', background: isHigh ? 'rgba(239, 68, 68, 0.05)' : 'rgba(2fbcd6, 0.05)', borderRadius: '8px', borderLeft: `3px solid ${isHigh ? '#ef4444' : '#fbbf24'}` }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                                                    <b style={{ color: '#fff', fontSize: '0.9rem' }}>{drop.section}</b>
                                                    <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: isHigh ? 'rgba(239, 68, 68, 0.2)' : 'rgba(2fbcd6, 0.2)', color: isHigh ? '#fca5a5' : '#fde047', fontWeight: 700 }}>{drop.riskLevel} RISK</span>
                                                </div>
                                                <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}><b style={{ color: '#94a3b8' }}>Reason:</b> {drop.reason}</div>
                                                <div style={{ fontSize: '0.85rem' }}><b style={{ color: '#94a3b8' }}>Recommendation:</b> <span style={{ color: '#a855f7' }}>{drop.recommendation}</span></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                            {/* Curiosity Loops */}
                            {Array.isArray(jsonData.curiosityLoopAnalysis) && (
                                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '1.2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <b style={{ color: '#38bdf8', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', display: 'block', marginBottom: '0.8rem' }}>Curiosity Loop Analysis</b>
                                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {jsonData.curiosityLoopAnalysis.map((item, i) => <li key={i}>{String(item)}</li>)}
                                    </ul>
                                </div>
                            )}

                            {/* Viewer Psychology */}
                            {Array.isArray(jsonData.viewerPsychologyInsights) && (
                                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '1.2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <b style={{ color: '#c084fc', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', display: 'block', marginBottom: '0.8rem' }}>Psychology Insights</b>
                                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {jsonData.viewerPsychologyInsights.map((item, i) => <li key={i}>{String(item)}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Unnecessary Sections */}
                        {Array.isArray(jsonData.unnecessarySections) && jsonData.unnecessarySections.length > 0 && (
                            <div style={{ padding: '1.2rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <b style={{ color: '#ef4444', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', display: 'block', marginBottom: '0.8rem' }}>Unnecessary Sections / Fluff</b>
                                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#fca5a5', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {jsonData.unnecessarySections.map((item, i) => <li key={i}>{String(item)}</li>)}
                                </ul>
                            </div>
                        )}

                        {/* Final Recommendations */}
                        {Array.isArray(jsonData.finalRecommendations) && jsonData.finalRecommendations.length > 0 && (
                            <div style={{ padding: '1.2rem', background: 'rgba(52, 211, 153, 0.05)', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                                <b style={{ color: '#34d399', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', display: 'block', marginBottom: '0.8rem' }}>Final Recommendations</b>
                                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#a7f3d0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {jsonData.finalRecommendations.map((item, i) => <li key={i}>{String(item)}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                );
            }

            if (activeAgentId === 13) {
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: '1.6', color: '#e4e4e7' }}>
                        {/* Summary / Score Header */}
                        <div style={{ padding: '1.2rem', background: 'rgba(236, 72, 153, 0.05)', borderRadius: '12px', border: '1px solid rgba(236, 72, 153, 0.2)', display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                            <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '1.2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '70px', height: '70px', flexShrink: 0, border: '2px solid rgba(236, 72, 153, 0.4)' }}>
                                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f472b6' }}>{jsonData.brandScore}</span>
                            </div>
                            <div>
                                <b style={{ color: '#f472b6', textTransform: 'uppercase', fontSize: '1rem', letterSpacing: '1px', display: 'block', marginBottom: '0.3rem' }}>Brand Consistency Score</b>
                                <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Overall alignment with brand voice, values, and legal safety. Status: <b style={{ color: jsonData.approvalStatus?.includes('APPROVED') ? '#34d399' : '#f87171' }}>{jsonData.approvalStatus}</b></div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.2rem' }}>
                            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <b style={{ color: '#818cf8', display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Voice Review</b>
                                <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>Status: <b style={{ color: '#e2e8f0' }}>{jsonData.voiceReview?.status}</b></div>
                                <div style={{ fontSize: '0.85rem' }}>{jsonData.voiceReview?.feedback}</div>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <b style={{ color: '#a855f7', display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Audience Alignment</b>
                                <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>Status: <b style={{ color: '#e2e8f0' }}>{jsonData.audienceAlignment?.status}</b></div>
                                <div style={{ fontSize: '0.85rem' }}>{jsonData.audienceAlignment?.feedback}</div>
                            </div>
                        </div>

                        {/* Claims */}
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <b style={{ color: '#38bdf8', display: 'block', marginBottom: '0.8rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Claim Review</b>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
                                <div>
                                    <b style={{ color: '#34d399', fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>Safe Claims</b>
                                    <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.8rem', color: '#a7f3d0' }}>
                                        {jsonData.claimReview?.safeClaims?.map((c, i) => <li key={i}>{c}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <b style={{ color: '#f87171', fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>Risky Claims</b>
                                    <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.8rem', color: '#fca5a5' }}>
                                        {jsonData.claimReview?.riskyClaims?.map((c, i) => <li key={i}>{c}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* CTA Review */}
                        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <b style={{ color: '#4ade80', display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>CTA Review</b>
                            <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>Status: <b style={{ color: '#e2e8f0' }}>{jsonData.ctaReview?.status}</b></div>
                            <div style={{ fontSize: '0.85rem' }}>{jsonData.ctaReview?.feedback}</div>
                        </div>

                        {/* Required Changes */}
                        {Array.isArray(jsonData.requiredChanges) && jsonData.requiredChanges.length > 0 && (
                            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid #ef4444' }}>
                                <b style={{ color: '#ef4444', display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Required Changes</b>
                                <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.85rem', color: '#fca5a5' }}>
                                    {jsonData.requiredChanges.map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                );
            }

            if (activeAgentId === 14) {
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: '1.6', color: '#e4e4e7' }}>
                        <div style={{ padding: '1.2rem', background: 'rgba(244, 63, 94, 0.05)', borderRadius: '12px', border: '1px solid rgba(244, 63, 94, 0.2)', display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                            <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '1.2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '70px', height: '70px', flexShrink: 0, border: '2px solid rgba(244, 63, 94, 0.4)' }}>
                                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fb7185' }}>{jsonData.overallScore}</span>
                            </div>
                            <div>
                                <b style={{ color: '#fb7185', textTransform: 'uppercase', fontSize: '1rem', letterSpacing: '1px', display: 'block', marginBottom: '0.3rem' }}>Final QC Score</b>
                                <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Decision: <b style={{ color: jsonData.publishReady ? '#34d399' : '#f87171' }}>{jsonData.finalDecision}</b></div>
                            </div>
                        </div>

                        <b style={{ color: '#e2e8f0', display: 'block', marginTop: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase' }}>Checklist Evaluation</b>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
                            {['hook', 'script', 'thumbnail', 'title', 'seo', 'brand'].map((key) => {
                                const item = jsonData.checklist?.[key];
                                if (!item) return null;
                                return (
                                    <div key={key} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <b style={{ color: '#818cf8', fontSize: '0.8rem', textTransform: 'uppercase' }}>{key}</b>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: item.score >= 80 ? '#34d399' : (item.score >= 60 ? '#fbbf24' : '#f87171') }}>{item.score}/100</span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{item.feedback}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {Array.isArray(jsonData.criticalIssues) && jsonData.criticalIssues.length > 0 && (
                            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid #ef4444' }}>
                                <b style={{ color: '#ef4444', display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Critical Issues</b>
                                <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.85rem', color: '#fca5a5' }}>
                                    {jsonData.criticalIssues.map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                            </div>
                        )}

                        {Array.isArray(jsonData.improvements) && jsonData.improvements.length > 0 && (
                            <div style={{ padding: '1rem', background: 'rgba(52, 211, 153, 0.05)', borderRadius: '8px', border: '1px solid #34d399' }}>
                                <b style={{ color: '#34d399', display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Suggested Improvements</b>
                                <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.85rem', color: '#a7f3d0' }}>
                                    {jsonData.improvements.map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                );
            }

            if (activeAgentId === 15) {
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: '1.6', color: '#e4e4e7' }}>
                        <div style={{ padding: '1.2rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <b style={{ color: '#34d399', textTransform: 'uppercase', fontSize: '1rem', letterSpacing: '1px', display: 'block', marginBottom: '0.6rem' }}>Performance Summary</b>
                            <div style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>{jsonData.performanceSummary}</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.8rem' }}>
                            {jsonData.metricsAnalysis && Object.entries(jsonData.metricsAnalysis).map(([key, value]) => (
                                <div key={key} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.8rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <b style={{ color: '#818cf8', display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', textTransform: 'uppercase' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</b>
                                    <div style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 'bold' }}>{value}</div>
                                </div>
                            ))}
                        </div>

                        {Array.isArray(jsonData.retentionIssues) && jsonData.retentionIssues.length > 0 && (
                            <div>
                                <b style={{ color: '#f87171', display: 'block', marginTop: '0.5rem', marginBottom: '0.8rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Retention Issues</b>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {jsonData.retentionIssues.map((issue, idx) => (
                                        <div key={idx} style={{ background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', padding: '1rem', borderLeft: '3px solid #ef4444' }}>
                                            <div style={{ marginBottom: '0.3rem' }}><b style={{ color: '#fff' }}>[{issue.timestamp}]</b> <span style={{ color: '#cbd5e1' }}>{issue.possibleReason}</span></div>
                                            <div style={{ fontSize: '0.85rem', color: '#a855f7' }}><b style={{ color: '#c084fc' }}>Fix:</b> {issue.improvement}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.2rem' }}>
                            {Array.isArray(jsonData.successfulElements) && (
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <b style={{ color: '#34d399', display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Successful Elements</b>
                                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#a7f3d0' }}>
                                        {jsonData.successfulElements.map((c, i) => <li key={i}>{c}</li>)}
                                    </ul>
                                </div>
                            )}
                            {Array.isArray(jsonData.problemsFound) && (
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <b style={{ color: '#f87171', display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Problems Found</b>
                                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#fca5a5' }}>
                                        {jsonData.problemsFound.map((c, i) => <li key={i}>{c}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {Array.isArray(jsonData.futureRecommendations) && (
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <b style={{ color: '#38bdf8', display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Future Recommendations</b>
                                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#bae6fd' }}>
                                    {jsonData.futureRecommendations.map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                );
            }

            return <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowX: 'hidden', margin: 0, fontSize: '0.85rem' }}>{JSON.stringify(jsonData, null, 2)}</pre>;
        } catch (err) {
            return (
                <div style={{ color: '#ef4444', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
                    <b>Render Error:</b> Failed to format this agent's output natively. Showing raw payload below:
                    <div style={{ marginTop: '1rem', overflow: 'auto' }}>
                        <pre style={{ margin: 0, fontSize: '0.75rem' }}>{JSON.stringify(jsonData, null, 2)}</pre>
                    </div>
                </div>
            );
        }
    };

    const progressPct = Math.round(((parseFloat(fullProject.Progress) || 0) / 15) * 100);

    return (
        <div className="yt-drop-in-anim" style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, overflow: 'hidden' }}>

            <div style={{ marginBottom: '1rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#a1a1aa'}>← Back to Projects</button>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#e4e4e7', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                {fullProject.ResearchBehavior === 'suggest_topics' ? (
                                    <>
                                        <span style={{ color: '#a1a1aa', fontWeight: '400', fontSize: '1rem' }}>Finding video topics from:</span>
                                        {fullProject.WorkingTitle || fullProject.SourceType}
                                    </>
                                ) : (
                                    <>
                                        <span style={{ color: '#a1a1aa', fontWeight: '400', fontSize: '1rem' }}>Researching:</span>
                                        {fullProject.WorkingTitle || 'Untitled Project'}
                                    </>
                                )}
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
                    {(() => {
                        const pVal = parseFloat(fullProject.Progress) || 0;
                        let phaseTitle = 'Phase 1: Create Video';
                        if (pVal >= 5 && pVal < 10) phaseTitle = 'Phase 2: Production';
                        else if (pVal >= 10 && pVal < 14) phaseTitle = 'Phase 3: Final Review';
                        else if (pVal >= 14) phaseTitle = 'Phase 4: Analytics';

                        return <div style={{ color: '#fff', fontWeight: 600 }}>{phaseTitle}</div>;
                    })()}
                </div>
            </div>

            <div className="yt-workspace-container">
                <div className="glass-panel" style={{ flex: '0 0 220px', padding: '1.2rem 1rem', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.75rem', color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '1px', flexShrink: 0 }}>WORKFLOW</div>
                    <div className="yt-custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                        {(() => {
                            const pVal = parseFloat(fullProject.Progress) || 0;
                            let activeVisibleGroups = ['Strategy', 'Story', 'Production', 'Packaging', 'Review', 'Performance'];

                            return activeVisibleGroups.map(group => (
                                <div key={group} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{group.toUpperCase()}</div>
                                    {YT_AGENTS.filter(a => a.group === group).map(a => {
                                        const isSelected = a.id === activeAgentId;
                                        const isCompleted = pVal >= a.id;
                                        const isLocked = a.id > pVal + 1;
                                        const canAccess = a.id <= pVal + 1;

                                        let nodeStatusText = '— Not Requested';
                                        if (isSelected && a.hasSir) {
                                            if (cpStatus === 'Approved') nodeStatusText = '— Approved';
                                            else if (cpStatus !== 'Not Requested' && cpStatus !== 'Ready to Request') nodeStatusText = `— ${cpStatus}`;
                                        } else if (isCompleted) {
                                            nodeStatusText = '— Approved';
                                        } else if (!canAccess) {
                                            nodeStatusText = '— Locked';
                                        }

                                        return (
                                            <React.Fragment key={a.id}>
                                                <div onClick={() => canAccess && setActiveAgentId(a.id)} style={{ padding: '0.4rem 0.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: canAccess ? 'pointer' : 'not-allowed', color: isCompleted ? '#34d399' : (isSelected ? '#fff' : 'var(--text-muted)'), opacity: isLocked ? 0.3 : 1, background: isSelected ? 'rgba(168,85,247,0.1)' : 'transparent', border: isSelected ? '1px solid rgba(168,85,247,0.4)' : '1px solid transparent', boxShadow: isSelected ? '0 0 10px rgba(168,85,247,0.15)' : 'none', transition: 'all 0.2s', margin: '0 -0.5rem' }}>
                                                    <span>{isCompleted ? '✓' : (isSelected ? '●' : '○')}</span>
                                                    <span style={{ fontWeight: isSelected ? 600 : 400 }}>{a.name} {isLocked ? '— Locked' : ''}</span>
                                                </div>
                                                {a.hasSir && (
                                                    <div style={{ marginLeft: '1.2rem', padding: '0.2rem 0', display: 'flex', flexDirection: 'column', gap: '0.2rem', color: isCompleted ? '#34d399' : (isSelected && cpStatus.includes('Waiting') ? '#fbbf24' : 'var(--text-muted)'), opacity: isLocked ? 0.3 : 1, fontSize: '0.75rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}><span>👤</span> SIR REVIEW</div>
                                                        <div style={{ marginLeft: '1.4rem', fontSize: '0.7rem' }}>{a.sirTitle} {nodeStatusText && nodeStatusText !== '— Locked' ? nodeStatusText : ''}</div>
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            ));
                        })()}
                    </div>
                </div>

                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
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
                                        <button className="yt-btn-primary" onClick={() => handleGenerate(false)} disabled={isGenerating || isApproving}>{isGenerating ? 'Generating...' : `Generate ${activeAgent?.name}`}</button>
                                        {isGenerating && jobStatusMsg && <div style={{ marginTop: '1rem', color: '#a1a1aa', fontSize: '0.9rem' }}>{jobStatusMsg}</div>}
                                    </div>
                                ) : (
                                    <div style={{ position: 'relative', fontSize: '0.9rem', lineHeight: 1.6, color: '#e4e4e7', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                        {latestRun && renderOutputData(latestRun.OutputData)}
                                        {isGenerating && !needsGeneration && (
                                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(17, 24, 39, 0.7)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexCol: 'column', zIndex: 10 }}>
                                                <div style={{ padding: '0.8rem 1.2rem', background: 'rgba(0,0,0,0.6)', borderRadius: '30px', border: '1px solid rgba(168,85,247,0.4)', color: '#fff', fontWeight: 600, display: 'flex', flexCol: 'column', alignItems: 'center', gap: '0.8rem', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
                                                    <span className="yt-spinner"></span> {jobStatusMsg || 'Generating Next Version...'}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {currentAgentRuns.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.8rem' }}>VERSIONS (Click to view history)</div>
                                    <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                        {currentAgentRuns.map(r => (
                                            <div key={r.RunID}
                                                onClick={() => setViewingVersion(r.Version)}
                                                style={{
                                                    display: 'flex', justifyContent: 'space-between',
                                                    color: viewingVersion == r.Version || (!viewingVersion && r.Version == currentAgentRuns[0].Version) ? '#fff' : '#a1a1aa',
                                                    cursor: 'pointer', padding: '0.6rem 1rem',
                                                    background: viewingVersion == r.Version || (!viewingVersion && r.Version == currentAgentRuns[0].Version) ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)',
                                                    borderRadius: '6px',
                                                    border: viewingVersion == r.Version || (!viewingVersion && r.Version == currentAgentRuns[0].Version) ? '1px solid rgba(168,85,247,0.5)' : '1px solid transparent',
                                                    transition: 'all 0.2s'
                                                }}>
                                                <div><span style={{ color: '#818cf8', marginRight: '1rem', fontWeight: 'bold' }}>V{r.Version}</span> {r.Status} {String(r.IsApproved) === 'true' && '(Approved)'}</div>
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
                                {activeAgentId === 2 ? (
                                    <>
                                        {!selectedAngleId ? (
                                            <div style={{ color: '#a1a1aa', fontSize: '0.9rem', flex: 1 }}>
                                                Select one angle to continue.
                                            </div>
                                        ) : (
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                <div style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    Selected Angle: {(() => {
                                                        try {
                                                            const angleObj = typeof latestRun.OutputData === 'string' ? JSON.parse(latestRun.OutputData) : latestRun.OutputData;
                                                            const idx = angleObj.angles.findIndex(x => x.id === selectedAngleId);
                                                            return idx > -1 ? idx + 1 : '?';
                                                        } catch (e) { return '?'; }
                                                    })()}
                                                </div>
                                                <div style={{ fontSize: '0.9rem', color: '#e4e4e7', fontWeight: 600 }}>
                                                    {(() => {
                                                        try {
                                                            const angleObj = typeof latestRun.OutputData === 'string' ? JSON.parse(latestRun.OutputData) : latestRun.OutputData;
                                                            const angle = angleObj.angles.find(x => x.id === selectedAngleId);
                                                            return angle?.angleTitle || angle?.title || 'Unknown Title';
                                                        } catch (e) { return 'Unknown'; }
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                            <button className="yt-btn-secondary" onClick={() => setShowFeedback(!showFeedback)}>Regenerate Angles</button>
                                            <button className="yt-btn-success" onClick={handleSubmitToSir} disabled={isGenerating || isSubmittingForSir || !selectedAngleId}>
                                                {isSubmittingForSir ? 'Submitting...' : 'Submit Selected Angle to Sir →'}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <button className="yt-btn-secondary" onClick={() => setShowFeedback(!showFeedback)}>Regenerate via AI Feedback</button>

                                        {(() => {
                                            const isDiscoveryOutput = activeAgentId === 1 && latestRun && typeof latestRun.OutputData === 'string'
                                                ? latestRun.OutputData.includes('topicOpportunities')
                                                : (latestRun?.OutputData?.topicOpportunities);

                                            if (activeAgentId === 1 && (fullProject.ResearchBehavior === 'suggest_topics' || isDiscoveryOutput)) {
                                                if (fullProject.ResearchBehavior === 'suggest_topics') {
                                                    return (
                                                        <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#a855f7', fontWeight: 600 }}>
                                                            Select a topic from the list above to continue.
                                                        </div>
                                                    );
                                                } else {
                                                    // Topic is selected (behavior flipped to research_topic), but they are still looking at discovery run
                                                    return (
                                                        <button className="yt-btn-primary" style={{ marginLeft: 'auto' }} onClick={() => handleGenerate(false)} disabled={isGenerating}>
                                                            {isGenerating ? 'Generating...' : 'Generate Deep Research →'}
                                                        </button>
                                                    );
                                                }
                                            }

                                            // Standard Approve Button
                                            return (
                                                <button className="yt-btn-success" style={{ marginLeft: 'auto' }} onClick={activeAgent?.hasSir ? handleSubmitToSir : handleApprove} disabled={isGenerating || isApproving || isSubmittingForSir || (activeAgentId === 7 && !selectedAngleId)}>
                                                    {isApproving || isSubmittingForSir ? 'Processing...' : (activeAgent?.hasSir ? `Submit ${activeAgentId === 5 ? 'Script' : activeAgent.name.split('. ')[1]} to Sir →` : (activeAgent?.actionText || 'Approve & Continue'))}
                                                </button>
                                            );
                                        })()}
                                    </>
                                )}
                            </div>

                            {showFeedback && (
                                <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <textarea className="input-field" rows="2" placeholder="Tell the AI what to change..." value={feedbackText} onChange={e => setFeedbackText(e.target.value)} style={{ width: '100%', marginBottom: '0.5rem' }} />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button className="yt-btn-secondary" onClick={() => setShowFeedback(false)}>Cancel</button>
                                        <button className="yt-btn-primary" onClick={() => handleGenerate(true)} disabled={isGenerating || isApproving}>{isGenerating ? 'Generating...' : 'Generate New Version'}</button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="glass-panel" style={{ flex: '0 0 220px', padding: '1.2rem 1rem', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    <div className="yt-custom-scrollbar" style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                        {activeAgent?.hasSir && (cpStatus.includes('Waiting') || cpStatus.includes('Feedback') || cpStatus.includes('Approved')) ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '0.85rem', color: '#e4e4e7', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '1px' }}>SIR'S REVIEW</div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <button className="yt-btn-primary" style={{ width: '100%', padding: '0.6rem', fontSize: '0.8rem', fontWeight: 600 }} onClick={handleCopyBrief}>{copyBriefText}</button>
                                </div>

                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>LATEST FEEDBACK</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{latestSirFeedback ? latestSirFeedback.FeedbackText : 'No feedback yet.'}</div>

                                <textarea className="input-field" rows="3" placeholder="Paste Sir's text reply, or upload his audio to auto-transcribe..." value={sirFeedbackText} onChange={e => setSirFeedbackText(e.target.value)} style={{ width: '100%', marginBottom: '0.5rem', fontSize: '0.8rem' }} />

                                <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                                    <label className="yt-btn-secondary" style={{ display: 'inline-flex', cursor: isTranscribing ? 'not-allowed' : 'pointer', fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>
                                        {isTranscribing ? 'Transcribing...' : '🎤 Add Voice Note'}
                                        <input type="file" accept="audio/*,video/*,.ogg,.opus,.m4a" style={{ display: 'none' }} onChange={handleVoiceUpload} disabled={isTranscribing} />
                                    </label>
                                </div>

                                <button className="yt-btn-primary" style={{ width: '100%', marginBottom: '0.5rem' }} onClick={() => handleSirSubmit(false)} disabled={isSubmittingSirReview || isGenerating}>Apply Feedback (Reject)</button>
                                <button className="yt-btn-success" style={{ width: '100%' }} onClick={() => handleSirSubmit(true)} disabled={isSubmittingSirReview || isGenerating}>Approve (Sir Approved)</button>
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
                                            {fullProject.referenceLearnings && <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Learning Targets</div><div style={{ color: '#e4e4e7' }}>{Array.isArray(fullProject.referenceLearnings) ? fullProject.referenceLearnings.join(', ') : fullProject.referenceLearnings}</div></div>}
                                            {fullProject.referenceNotes && <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Reference Notes</div><div style={{ color: '#e4e4e7' }}>{fullProject.referenceNotes}</div></div>}
                                        </>
                                    )}

                                    {activeAgentId === 7 && (() => {
                                        const out = latestRun?.OutputData;
                                        if (!out) return null;
                                        let parsedOut = out;
                                        try { if (typeof out === 'string') parsedOut = JSON.parse(out); } catch (e) { }
                                        if (!parsedOut.thumbnailConcepts) return null;

                                        const sel = parsedOut.thumbnailConcepts.find(c => c.id === selectedAngleId);
                                        if (!sel) return null;

                                        return (
                                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                                <div style={{ fontSize: '0.85rem', color: '#e4e4e7', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>COPY BRIEF</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.8rem' }}>
                                                    <div><div style={{ color: 'var(--text-muted)' }}>Project:</div><div style={{ color: '#6ee7b7' }}>Thumbnail Strategy</div></div>
                                                    <div><div style={{ color: 'var(--text-muted)' }}>Video Topic:</div><div style={{ color: '#e4e4e7' }}>{fullProject.WorkingTitle || 'Not provided'}</div></div>
                                                    <div><div style={{ color: 'var(--text-muted)' }}>Selected Concept:</div><div style={{ color: '#a855f7' }}>{sel.conceptName}</div></div>
                                                    <div><div style={{ color: 'var(--text-muted)' }}>Main Visual:</div><div style={{ color: '#e4e4e7' }}>{sel.mainVisual}</div></div>
                                                    <div><div style={{ color: 'var(--text-muted)' }}>Thumbnail Copy:</div><div style={{ color: '#fbbf24' }}>{sel.thumbnailCopy || 'None'}</div></div>
                                                    <div><div style={{ color: 'var(--text-muted)' }}>Emotional Trigger:</div><div style={{ color: '#e4e4e7' }}>{sel.emotionalTrigger}</div></div>
                                                    <div><div style={{ color: 'var(--text-muted)' }}>Curiosity Gap:</div><div style={{ color: '#e4e4e7' }}>{sel.curiosityGap}</div></div>
                                                    <div><div style={{ color: 'var(--text-muted)' }}>Reason It Could Work:</div><div style={{ color: '#e4e4e7' }}>{sel.whyItCouldWork}</div></div>
                                                    <div><div style={{ color: 'var(--text-muted)' }}>Review Focus:</div><div style={{ color: '#e4e4e7' }}>Visual impact, contrast, and CTR potential.</div></div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


// ─────────────────────────────────────────────────────────────────────────────
function YoutubeSettings() {
    const [memory, setMemory] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMemory = async () => {
            try {
                const res = await fetch(`${API_URL}/yt/learning`);
                const data = await res.json();
                if (!data.error) setMemory(data);
                setLoading(false);
            } catch (err) {
                console.error('Failed to load AI Memory', err);
                setLoading(false);
            }
        };
        fetchMemory();
    }, []);

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#a1a1aa' }}>Loading AI Memory...</div>;

    const learnedStyle = memory?.learnedStyle || {};
    const learnedPreferences = memory?.learnedPreferences || [];
    const history = memory?.history || [];
    const aiConfig = memory?.aiConfig || {};

    return (
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '3rem' }}>
            <div style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'visible' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                    <h2 style={{ fontSize: '1.6rem', color: '#fff', margin: 0, fontWeight: 600 }}>AI Memory & Learning Dashboard</h2>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        This panel displays the AI's autonomous contextual knowledge derived directly from Sir's feedback loop.
                    </div>
                </div>

                {/* A) AI Configuration */}
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#e4e4e7', fontSize: '1.1rem' }}>AI Configuration</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Current Provider</span>
                            <span style={{ color: '#fff', fontWeight: 500 }}>{aiConfig.provider || 'Gemini'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Current Model</span>
                            <span style={{ color: '#a855f7', fontWeight: 500 }}>{aiConfig.model || 'gemini-2.5-flash'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Fallback Status</span>
                            <span style={{ color: '#fbbf24', fontWeight: 500 }}>{aiConfig.fallbackStatus || 'OpenRouter'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Connection Status</span>
                            <span style={{ color: '#34d399', fontWeight: 500 }}>● {aiConfig.connectionStatus || 'Connected'}</span>
                        </div>
                    </div>
                </div>

                {/* B) Learned Sir Style */}
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#e4e4e7', fontSize: '1.1rem' }}>Learned Sir Style Guide</h3>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                        The core architectural style extracted from overarching video corrections.
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#a855f7', marginBottom: '0.4rem', textTransform: 'uppercase', fontWeight: 600 }}>Content Style</div>
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px', color: '#e4e4e7', fontSize: '0.9rem' }}>
                                {learnedStyle.contentStyle || 'No content style learned yet.'}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#34d399', marginBottom: '0.4rem', textTransform: 'uppercase', fontWeight: 600 }}>Script Style</div>
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px', color: '#e4e4e7', fontSize: '0.9rem' }}>
                                {learnedStyle.scriptStyle || 'No script style learned yet.'}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginBottom: '0.4rem', textTransform: 'uppercase', fontWeight: 600 }}>Title Preferences</div>
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px', color: '#e4e4e7', fontSize: '0.9rem' }}>
                                {learnedStyle.titlePreferences || 'No title preferences learned yet.'}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#ef4444', marginBottom: '0.4rem', textTransform: 'uppercase', fontWeight: 600 }}>Thumbnail Preferences</div>
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px', color: '#e4e4e7', fontSize: '0.9rem' }}>
                                {learnedStyle.thumbnailPreferences || 'No thumbnail preferences learned yet.'}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#60a5fa', marginBottom: '0.4rem', textTransform: 'uppercase', fontWeight: 600 }}>Brand Preferences</div>
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px', color: '#e4e4e7', fontSize: '0.9rem' }}>
                                {learnedStyle.brandPreferences || 'No brand preferences learned yet.'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* C) Learned Preferences */}
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#e4e4e7', fontSize: '1.1rem' }}>Learned Preferences</h3>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                        Specific dynamic rules triggering active constraint adjustments inside agent logic flows.
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.8rem' }}>
                        {learnedPreferences.map((pref, i) => (
                            <div key={i} style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ color: '#34d399' }}>✓</span>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ color: '#e4e4e7', fontSize: '0.9rem' }}>{pref.rule}</span>
                                    {pref.appliesTo && pref.appliesTo.length > 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.2rem', textTransform: 'uppercase' }}>Agents: {pref.appliesTo.join(', ')}</span>}
                                </div>
                            </div>
                        ))}
                        {learnedPreferences.length === 0 && (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No explicit rules learned yet.</div>
                        )}
                    </div>
                </div>

                {/* APPROVED PATTERNS */}
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#e4e4e7', fontSize: '1.1rem' }}>Approved Patterns</h3>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                        Previous successful outputs that Sir approved. Agents use these as reference.
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {(memory?.approvalHistory || []).map((h, i) => (
                            <div key={i} style={{ padding: '1rem', background: 'rgba(52, 211, 153, 0.05)', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#34d399', marginBottom: '0.4rem', fontWeight: 600 }}>{h.agent} — {h.date} (Project: {h.projectId})</div>
                                <div style={{ color: '#e4e4e7', fontSize: '0.9rem', marginBottom: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: '4px' }}>"{h.output}"</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}><strong>Approval Reason:</strong> {h.approvalReason}</div>
                            </div>
                        ))}
                        {!(memory?.approvalHistory?.length) && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No approved patterns logged.</div>}
                    </div>
                </div>

                {/* REJECTED PATTERNS */}
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#ef4444', fontSize: '1.1rem' }}>Rejected Patterns & Corrections</h3>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                        Mistakes to avoid. Injected into agents to prevent repeated errors.
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {(memory?.rejectedIdeas || []).map((r, i) => (
                            <div key={i} style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#ef4444', marginBottom: '0.4rem', fontWeight: 600 }}>{r.agent} (Project: {r.projectId})</div>
                                <div style={{ color: '#e4e4e7', fontSize: '0.9rem', marginBottom: '0.5rem', textDecoration: 'line-through', background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: '4px' }}>"{r.rejectedOutput}"</div>
                                <div style={{ color: '#f87171', fontSize: '0.8rem', fontStyle: 'italic', marginBottom: '0.4rem' }}>{r.rejectionReason}</div>
                                <div style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: 600 }}>Learned Rule: {r.learnedAvoidRule}</div>
                            </div>
                        ))}
                        {!(memory?.rejectedIdeas?.length) && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No rejected patterns logged.</div>}
                    </div>
                </div>

                {/* AGENT PERFORMANCE GRID */}
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#e4e4e7', fontSize: '1.1rem' }}>Agent Intelligence Performance</h3>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                        Autonomous scoring based on historical approvals, rejections, and revisions.
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        {Object.entries(memory?.agentPerformance || {}).map(([agent, stats], i) => (
                            <div key={agent} style={{ display: 'flex', flexDirection: 'column', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ color: '#e4e4e7', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>{agent}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Score</span>
                                    <span style={{ fontSize: '0.8rem', color: stats.performanceScore > 80 ? '#34d399' : '#fbbf24', fontWeight: 600 }}>{stats.performanceScore}%</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Approved</span>
                                    <span style={{ fontSize: '0.8rem', color: '#e4e4e7' }}>{stats.approvedCount}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rejected</span>
                                    <span style={{ fontSize: '0.8rem', color: '#e4e4e7' }}>{stats.rejectedCount}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* D) Learning History */}
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#e4e4e7', fontSize: '1.1rem' }}>Learning History</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {history.map((h, i) => (
                            <div key={i} style={{ paddingBottom: '1rem', borderBottom: i < history.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{h.date} — {h.source}</div>
                                <div style={{ color: '#fbbf24', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                    "{h.learned}"
                                </div>
                            </div>
                        ))}
                        {history.length === 0 && (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>History is empty.</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
