import { useState, useEffect, useRef } from 'react';

/*
 * Path A integration: the Meta Ads Agent is a separate FastAPI app (own repo,
 * own Vercel deployment). This view just frames its deployed dashboard.
 *
 * Known issue (found via stress testing): loading the dashboard through this
 * iframe is intermittently unreliable — it sometimes hangs on a partial
 * render even though direct navigation to the same URL always works cleanly.
 * Root cause wasn't pinned down (no localStorage/frame-detection code in the
 * embedded app, and the server responds identically regardless of Origin/
 * Referer, so it isn't a simple embed-detection block). Since the iframe's
 * `load` event can fire before the embedded app has actually finished
 * rendering, don't rely on `loaded` alone to prove success — the manual
 * Reload button and "Open in new tab" link are the real safety nets here,
 * not just decoration.
 *
 * If this keeps proving unreliable in normal use, the fallback plan is a
 * native rebuild (Path B): a proxy layer + React view calling the Meta Ads
 * Agent's API directly instead of iframing its dashboard.
 */
const META_ADS_URL = import.meta.env.VITE_META_ADS_URL;
const LOAD_TIMEOUT_MS = 8000;
const MAX_AUTO_RETRIES = 1;

export default function MetaAdsFactory() {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!META_ADS_URL) return undefined;
    setLoaded(false);
    setStuck(false);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (attempt < MAX_AUTO_RETRIES) {
        setAttempt((a) => a + 1); // bumps the iframe's key, forcing a clean remount
      } else {
        setStuck(true);
      }
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timerRef.current);
  }, [attempt]);

  if (!META_ADS_URL) {
    return (
      <div className="app-container" style={{ textAlign: 'center', paddingTop: '10vh' }}>
        <h2>🎯 Meta Ads Agent not connected yet</h2>
        <p style={{ opacity: 0.7, maxWidth: 480, margin: '0.75rem auto' }}>
          Set <code>VITE_META_ADS_URL</code> in <code>frontend/.env</code> (local dev) and in the
          Vercel Project Settings for this app (production) once the Meta Ads Agent has been
          deployed to its own Vercel project.
        </p>
      </div>
    );
  }

  function handleLoad() {
    clearTimeout(timerRef.current);
    setLoaded(true);
    setStuck(false);
  }

  function handleReload() {
    setIframeError(false);
    setStuck(false);
    setLoaded(false);
    setAttempt((a) => a + 1);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>
          {stuck ? '⚠️ Taking longer than expected — try Reload' : !loaded ? 'Loading…' : ''}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
            onClick={handleReload}
          >
            ↻ Reload
          </button>
          <a
            href={META_ADS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
          >
            Open in new tab ↗
          </a>
        </div>
      </div>

      {iframeError ? (
        <div className="app-container" style={{ textAlign: 'center', paddingTop: '10vh' }}>
          <h2>⚠️ Couldn't embed the Meta Ads Agent here</h2>
          <p style={{ opacity: 0.7, maxWidth: 480, margin: '0.75rem auto' }}>
            It may have Vercel Deployment Protection enabled, or is refusing to be framed. Use
            "Open in new tab" above instead.
          </p>
        </div>
      ) : (
        <div style={{ position: 'relative', flex: 1 }}>
          {!loaded && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(8,8,16,0.9)',
                borderRadius: '12px',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            >
              <div className="loader" style={{ width: '32px', height: '32px', marginBottom: '0.75rem' }} />
              <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>
                {stuck ? 'Still not loading — click Reload above, or open in a new tab.' : 'Loading Meta Ads Agent…'}
              </p>
            </div>
          )}
          <iframe
            key={attempt}
            src={META_ADS_URL}
            title="Meta Ads Agent"
            style={{
              width: '100%',
              height: '100%',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              background: '#fff',
            }}
            onLoad={handleLoad}
            onError={() => setIframeError(true)}
          />
        </div>
      )}
    </div>
  );
}
