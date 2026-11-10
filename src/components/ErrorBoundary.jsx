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
    const isAutoRecoverable =
      errMsg.includes('Failed to fetch dynamically imported module') ||
      errMsg.includes('Importing a module script failed') ||
      errMsg.includes('error loading dynamically imported module') ||
      errMsg.includes('Minified React error #300') ||
      errMsg.includes('Rendered fewer hooks than expected') ||
      error?.name === 'ChunkLoadError';

    if (isAutoRecoverable) {
      const lastReload = sessionStorage.getItem('iris_auto_recover_ts');
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 15000) {
        sessionStorage.setItem('iris_auto_recover_ts', String(now));
        // Force reload without cache
        if (typeof window !== 'undefined') {
          try {
            if ('caches' in window) {
              caches.keys().then(names => names.forEach(n => caches.delete(n))).catch(() => {});
            }
          } catch (e) {}
          window.location.href = window.location.origin + window.location.pathname + '?t=' + now;
          return;
        }
      }
    }
    this.setState({ errorInfo });
  }

  handleHardReload = () => {
    try {
      if ('caches' in window) {
        caches.keys().then(names => names.forEach(n => caches.delete(n))).catch(() => {});
      }
    } catch (e) {}
    window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', background: '#fee2e2', color: '#991b1b', borderRadius: '16px', margin: '20px', maxWidth: '700px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠️ ระบบพบข้อผิดพลาด (Crash)
          </h2>
          <p style={{ marginTop: '10px', fontSize: '13px', lineHeight: '1.6', color: '#7f1d1d' }}>
            {this.state.error && this.state.error.toString()}
          </p>
          <div style={{ marginTop: '12px', background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #fca5a5', fontSize: '12px', color: '#991b1b' }}>
            💡 <strong>วิธีแก้ปัญหา:</strong> ข้อผิดพลาดนี้อาจเกิดจากไฟล์เวอร์ชันเก่าตกค้างในแคชของเบราว์เซอร์ กรุณากดปุ่ม <strong>"ล้างแคชและรีเฟรชใหม่"</strong> ด้านล่างเพื่อโหลดเวอร์ชันล่าสุด
          </div>
          <pre style={{ marginTop: '12px', background: '#f87171', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '11px', overflowX: 'auto', maxHeight: '180px' }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={this.handleHardReload}
              style={{ background: '#dc2626', color: 'white', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}
            >
              🔄 ล้างแคชและรีเฟรชใหม่
            </button>
            <button 
              onClick={() => window.location.reload()}
              style={{ background: '#ffffff', color: '#dc2626', border: '1px solid #dc2626', padding: '10px 18px', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
            >
              รีเฟรชหน้าจอปกติ
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
