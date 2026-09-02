import React, { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global diagnostic error listeners to prevent silent blank screens
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[Global Error Caught]:', event.error || event.message);
    const root = document.getElementById('root');
    // If chunk failed to fetch or root is unmounted, auto-reload without stale params
    if (event.message && (event.message.includes('dynamically imported module') || event.message.includes('Loading chunk'))) {
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.location.href = cleanUrl;
      return;
    }
    if (root && (!root.children || root.children.length === 0)) {
      root.innerHTML = `<div style="padding:30px;background:#0f172a;color:#f87171;font-family:sans-serif;min-height:100vh;display:flex;flex-col;align-items:center;justify-content:center;text-align:center;">
        <div style="max-width:500px;background:#1e293b;padding:30px;border-radius:16px;border:1px solid #334155;">
          <h2 style="color:#ef4444;margin-top:0;font-size:20px;">⚠️ App Update Detected</h2>
          <p style="color:#cbd5e1;font-size:14px;line-height:1.6;">A new platform update was deployed. Click below to refresh your session.</p>
          <button onclick="localStorage.clear();sessionStorage.clear();window.location.href=window.location.protocol+'//'+window.location.host+window.location.pathname;" style="background:#10b981;color:white;border:none;padding:12px 24px;border-radius:10px;cursor:pointer;font-weight:bold;margin-top:15px;font-size:14px;">Reload Fresh App</button>
        </div>
      </div>`;
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Global Unhandled Rejection Caught]:', event.reason);
  });
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[PharmDVerse Runtime Exception]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-2xl font-black">
              !
            </div>
            <h1 className="text-lg font-extrabold text-white tracking-tight">System Notice</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              An unexpected runtime error occurred while rendering the page. Click below to refresh and reload the session.
            </p>
            {this.state.error?.message && (
              <p className="text-[11px] font-mono text-rose-300 bg-rose-950/40 p-3 rounded-xl border border-rose-900/40 break-words text-left">
                {this.state.error.message}
              </p>
            )}
            <div className="flex items-center gap-3 w-full pt-2">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Dismiss & Retry
              </button>
              <button
                onClick={() => { 
                  localStorage.clear();
                  sessionStorage.clear(); 
                  if ('caches' in window) {
                    caches.keys().then(names => {
                      names.forEach(name => caches.delete(name));
                    });
                  }
                  window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now(); 
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-lg transition-all cursor-pointer"
              >
                Clear Cache & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
