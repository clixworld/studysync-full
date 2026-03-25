import { startCanvasOAuth } from '../lib/api'

export default function Connect() {
  return (
    <div className="page-enter" style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 28px', textAlign: 'center',
    }}>

      {/* Logo mark */}
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: 'var(--canvas-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
      }}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="14" stroke="var(--canvas-color)" strokeWidth="2" fill="none" opacity="0.3"/>
          <path d="M10 18C10 13.6 13.6 10 18 10C22.4 10 26 13.6 26 18C26 22.4 22.4 26 18 26"
            stroke="var(--canvas-color)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <circle cx="18" cy="18" r="3" fill="var(--canvas-color)"/>
        </svg>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
        Welcome to StudySync
      </h1>
      <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 28, maxWidth: 280 }}>
        Connect your Canvas account to automatically sync assignments, deadlines, and announcements.
      </p>

      {/* Permissions list */}
      <div style={{
        width: '100%', background: 'var(--bg2)',
        borderRadius: 'var(--radius-lg)', padding: '4px 0',
        marginBottom: 24, textAlign: 'left',
      }}>
        {[
          { icon: '📅', text: 'Read your assignments and due dates' },
          { icon: '📢', text: 'Read course announcements' },
          { icon: '☑️', text: 'Read your Canvas to-do list' },
          { icon: '🔒', text: 'We never post or modify anything' },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 16px',
            borderBottom: i < 3 ? '0.5px solid var(--border)' : 'none',
          }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>{item.text}</span>
          </div>
        ))}
      </div>

      <button
        onClick={startCanvasOAuth}
        style={{
          width: '100%', padding: '14px',
          background: 'var(--canvas-color)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius)',
          fontSize: 15, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'var(--font)',
          transition: 'transform 0.2s cubic-bezier(.34,1.56,.64,1), background 0.15s',
          marginBottom: 12,
        }}
        onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.background = '#0F6E56' }}
        onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--canvas-color)' }}
      >
        Connect with Canvas
      </button>

      <p style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
        Using UTA Canvas · uta.instructure.com<br/>
        You can disconnect at any time in settings.
      </p>
    </div>
  )
}
