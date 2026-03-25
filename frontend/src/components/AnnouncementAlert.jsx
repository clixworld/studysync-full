import { useState } from 'react'

export default function AnnouncementAlert({ alert, onAddToCalendar, onDismiss }) {
  const [adding, setAdding] = useState(false)
  const [added,  setAdded]  = useState(false)

  async function handleAdd() {
    setAdding(true)
    await onAddToCalendar(alert)
    setAdded(true)
    setAdding(false)
  }

  return (
    <div style={{
      background: 'var(--warning-light)',
      border: '0.5px solid var(--warning)',
      borderRadius: 'var(--radius)',
      padding: '12px 14px',
      marginBottom: 10,
      animation: 'slideIn 0.3s cubic-bezier(.34,1.56,.64,1) both',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#633806', marginBottom: 3 }}>
            {alert.courseName} — New announcement
          </p>
          <p style={{ fontSize: 12, color: '#854F0B', lineHeight: 1.5, marginBottom: 10 }}>
            {alert.title}
          </p>

          {/* Detected dates */}
          {alert.detectedDates?.map((d, i) => (
            <div key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.5)', borderRadius: 8,
              padding: '3px 10px', marginBottom: 8, marginRight: 6,
              fontSize: 11, color: '#633806', fontWeight: 500,
            }}>
              <CalDot />
              {d.description} — {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {added ? (
          <span style={{ fontSize: 11, color: '#0F6E56', fontWeight: 500 }}>✓ Added to calendar</span>
        ) : (
          <button
            onClick={handleAdd}
            disabled={adding}
            style={{
              fontSize: 11, padding: '5px 14px',
              background: adding ? 'var(--border)' : '#EF9F27',
              color: '#412402', border: 'none', borderRadius: 8,
              fontWeight: 600, transition: 'all 0.15s',
            }}
          >
            {adding ? 'Adding…' : 'Add to calendar'}
          </button>
        )}
        <button
          onClick={() => onDismiss(alert.id)}
          style={{
            fontSize: 11, padding: '5px 12px',
            background: 'none', color: '#854F0B',
            border: '0.5px solid var(--warning)', borderRadius: 8,
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

function CalDot() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <rect x="1" y="2" width="8" height="7" rx="1.5" stroke="#854F0B" strokeWidth="1" />
      <path d="M1 4h8" stroke="#854F0B" strokeWidth="1" />
      <path d="M3 1v2M7 1v2" stroke="#854F0B" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}
