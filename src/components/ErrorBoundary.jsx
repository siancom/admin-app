import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    const errMsg = String(error?.message || error || '');
    const isChunkLoadError =
      errMsg.includes('Failed to fetch dynamically imported module') ||
      errMsg.includes('Importing a module script failed') ||
      errMsg.includes('error loading dynamically imported module') ||
      error?.name === 'ChunkLoadError';

    if (isChunkLoadError) {
      const lastReload = sessionStorage.getItem('iris_chunk_reload_ts');
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 10000) {
        sessionStorage.setItem('iris_chunk_reload_ts', String(now));
        window.location.reload();
        return;
      }
    }
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#fee2e2', color: '#991b1b', borderRadius: '10px', margin: '20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>⚠️ ระบบพบข้อผิดพลาด (Crash)</h2>
          <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{this.state.error && this.state.error.toString()}</p>
          <pre style={{ marginTop: '10px', background: '#f87171', color: '#fff', padding: '10px', borderRadius: '5px', overflowX: 'auto' }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px', background: '#dc2626', color: 'white', padding: '10px 20px', borderRadius: '8px' }}
          >
            รีเฟรชหน้าจอ
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
