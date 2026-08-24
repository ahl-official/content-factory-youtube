# Long-Form YouTube Agent System Implementation Plan (Updated)

## 1. Core Principles
The goal is to build a robust, separate **Long-Form YouTube Agent System** within the Content Factory. This system explicitly supports the unique demands of long-form content (retention, structure, packaging) without impacting the short-form workflow.

**Strict Mandates:**
1. **Zero Reel Interruption:** The existing Reel Factory runs its 12-agent pipeline and remains functionally untouched.
2. **Isolated Database (Google Sheets):** A brand-new Google Sheet document will be deployed specifically for YouTube metrics and persistence. We strictly avoid migrating data to Supabase or other external databases.
3. **No Hidden AI Costs:** We exclusively mandate 100% free models on OpenRouter (e.g. `google/gemini-2.5-flash:free` or `meta-llama/llama-3-8b-instruct:free`) for development. There will be no fallback to paid APIs natively during development.

## 2. 15-Agent Roles + Conditional Storytelling
The exact agents described in the PDF architecture are the sole user-facing actors in the application.

1. **Research Agent:** Competitor research, Reddit/Quora, trending topics.
2. **Content Angle Generator:** 20-50 initial video concepts per topic.
3. **YouTube Strategist:** Browse vs Search orientation and topic prioritization.
4. **Video Structure Architect:** Complete video outline, chapter flow, curiosity loops.
5. **Script Writer:** Full script with analogy, humor, pacing.
6. **Creative Director:** Visual planning, b-roll, camera movements.
7. **Thumbnail Strategist:** Emotional pull and CTR optimization.
8. **Thumbnail Designer:** Layout and typographic directives for final thumbnails.
9. **Title Strategist:** 30-50 CTR optimized titles.
10. **SEO Agent:** Keywords, chapters, descriptions.
11. **Video Editor:** Suggestive retention optimization for the editing timeline.
12. **Retention Analyst:** Proactive psychological review of drop-off points prior to upload.
13. **Brand Consistency Agent:** Tone and premium positioning validation.
14. **Quality Control Agent:** The final comprehensive review.
15. **Analytics Agent:** Post-upload interpretation of performance data.
- **+ Consultation Storytelling Agent:** A native pipeline disruption when processing consultation-focused content, tasked specifically to restructure authentic consultations by highlighting the hidden hero/emotional journeys.

## 3. Database Schema (New Google Sheet)
All backend persistence will happen in a **New Google Sheet Document**, entirely separate from the Reels DB. Built along the following tabs:
- **`YT_Projects`**: Master list of video projects and operational statuses.
- **`YT_AgentRuns`**: Records of individual agent outputs.
- **`YT_Research`**: Aggregated research outputs.
- **`YT_Feedback`**: Stakeholder (Sir's) reviews and iterations.
- **`YT_Scripts`**: Outlines and final drafted scripts.
- **`YT_Assets`**: Concepts for metadata, thumbnails, and descriptions.
- **`YT_Analytics`**: Retention and CTR feedback.
- **`YT_Settings`**: Application state variables mapping strictly to YouTube constraints.

## 4. Development Roadmap

### Phase 1: Frontend Shell & UI Scaffold (Mocks Only)
*No real AI or DB integration occurs during this phase. Priority on UI/UX approval.*
1. **Global App Switcher:** Update `App.jsx` to intercept the top level with a smooth toggle between the Reels Factory and the new YouTube Factory.
2. **Dashboard UI:** Scaffold `YoutubeDashboardView.jsx` representing all `YT_Projects` visually.
3. **Project Ignition Screen:** Build `YoutubeNewProject.jsx` detailing audience goals, topic seeding, and Consultation constraints options.
4. **Project Workspace UI:** Build `YoutubeProjectWorkspace.jsx`. This is not a replica of the Reel chat pipeline, but an explicit 16-agent dashboard tracking each agent's completion, allowing stakeholder override at each checkpoint. 
5. **Visual Conformity:** Strictly reuse the existing `App.css` and `index.css` elements (glass panels, buttons, typography).

### Phase 2: Backend DB Setup & Logic Implementation
*Pending approval of Phase 1.*
1. Provision the new Google Sheets Document with exact tab names.
2. Write `server.js` extension using the existing OpenRouter drivers (but separate API routes `/api/yt/*`).
3. Connect the frontend mock states directly to the Google Sheets backend.

### Phase 3: The Free AI Pipeline
1. Program the 16 YouTube Agents internally mapping back to the OpenRouter Free APIs.
2. Deploy the custom Consultation Storytelling disruption logic.
3. Execute end-to-end sandbox tests with real AI content outputs saving into Sheets.

## 5. Folder Hierarchy Map
```text
content-factory/
├── config.js               [Inject YT_SHEET_ID, enforce FREE OpenRouter keys]
├── server.js               [Route separation /api/yt/]
├── routes/                 
│   └── youtube.js          [Routing definitions]
├── youtube/                
│   ├── youtubeAgents.js    [Definitions of the PDF's 15+1 Agents]
│   └── youtubeDatabase.js  [Adapter pointing distinctly to YT_SHEET_ID]
└── frontend/
    └── src/
        ├── App.jsx         [Contains the Reel/YT Global Switcher]
        ├── components/     
        │   ├── ReelFactory.jsx       [Houses current short-form code]
        │   └── YoutubeFactory.jsx    [Houses the new long-form scaffold]
        └── youtube/        
            ├── YoutubeDashboardView.jsx
            ├── YoutubeNewProject.jsx
            ├── YoutubeProjectWorkspace.jsx
            └── ...
```
