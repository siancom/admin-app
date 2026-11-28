import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Prevent iOS Safari gesture zoom (pinch-to-zoom)
if (typeof document !== 'undefined') {
  document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });
}

// Global safety fallback for WebKit / Safari legacy scopes
if (typeof window !== 'undefined') {
  window.user = window.user || null;
}

window.addEventListener('vite:preloadError', () => {
  const lastReload = sessionStorage.getItem('iris_chunk_reload_ts')
  const now = Date.now()
  if (!lastReload || now - Number(lastReload) > 10000) {
    sessionStorage.setItem('iris_chunk_reload_ts', String(now))
    window.location.reload()
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
