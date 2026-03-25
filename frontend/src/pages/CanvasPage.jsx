import { useState } from 'react'
import { useCanvas } from '../hooks/useCanvas'
import { getUserName, logout, syncTasks } from '../lib/api'

export default function CanvasPage() {
  const { courses, loading, syncing, sync } = useCanvas()
  const name = getUserName() || 'Student'
  const [synced, setSynced] = useState(false)

  async function handleSync() {
    await sync()
    setSynced(true)
    setTimeout(() => setSynced(false), 3000)
  }

  return (
    <div className="page-enter" style={{ flex: 1, overflowY: 'auto', padding: '20px 18px' }}>

      {/* User card */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px',
        background: 'var(--canvas-light)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 20,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'var(--canvas-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 600, color: '#fff',
          flexShrink: 0,
        }}>
          {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#085041' }}>{name}</p>
          <p style={{ fontSize: 12, color: '#0F6E56', marginTop: 2 }}>Canvas connected · UTA</p>
        </div>
        <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: 'var(--canvas-color)', flexShrink: 0 }} />
      </div>

      {/* Sync button */}
      <button
        onClick={handleSync}
        disabled={syncing}
        style={{
          width: '100%', padding: '13px',
          background: synced ? 'var(--canvas-color)' : 'var(--accent)',
          color: '#fff', border: 'none', borderRadius: 'var(--radius)',
          fontSize: 14, fontWeight: 600, marginBottom: 20,
          cursor: syncing ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font)',
          transition: 'all 0.3s cubic-bezier(.34,1.56,.64,1)',
          transform: syncing ? 'scale(0.98)' : 'scale(1)',
        }}
      >
        {syncing ? 'Syncing…' : synced ? '✓ Synced!' : '↻ Sync Canvas now'}
      </button>

      {/* Courses */}
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
        Your courses
      </p>

      {loading ? (
        [1,2,3].map(n => <div key={n} className="skeleton" style={{ height: 52, marginBottom: 6 }} />)
      ) : courses.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text3)' }}>No active courses found. Try syncing.</p>
      ) : (
        courses.map(course => (
          <div key={course.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 0', borderBottom: '0.5px solid var(--border)',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'var(--canvas-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, color: 'var(--canvas-color)',
            }}>
              {course.course_code?.slice(0, 4) || course.name?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{course.name}</p>
              {course.course_code && <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{course.course_code}</p>}
            </div>
          </div>
        ))
      )}

      {/* Danger zone */}
      <div style={{ marginTop: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Account
        </p>
        <button
          onClick={() => { if (window.confirm('Disconnect Canvas and log out?')) logout() }}
          style={{
            width: '100%', padding: '12px',
            background: 'none', color: 'var(--danger)',
            border: '0.5px solid var(--danger)', borderRadius: 'var(--radius)',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'var(--font)', transition: 'background 0.15s',
          }}
          onMouseOver={e => e.currentTarget.style.background = 'var(--danger-light)'}
          onMouseOut={e => e.currentTarget.style.background = 'none'}
        >
          Disconnect Canvas
        </button>
      </div>

      <div style={{ height: 20 }} />
    </div>
  )
}
