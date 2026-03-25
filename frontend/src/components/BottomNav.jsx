import { useLocation, useNavigate } from 'react-router-dom'

const tabs = [
  { path: '/dashboard', label: 'Home',     icon: HomeIcon },
  { path: '/tasks',     label: 'Tasks',    icon: TaskIcon },
  { path: '/schedule',  label: 'Schedule', icon: CalIcon  },
  { path: '/canvas',    label: 'Canvas',   icon: CanvasIcon },
]

export default function BottomNav() {
  const loc = useLocation()
  const nav = useNavigate()

  return (
    <nav style={{
      display: 'flex',
      borderTop: '0.5px solid var(--border)',
      background: 'var(--bg)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(t => {
        const active = loc.pathname === t.path
        return (
          <button
            key={t.path}
            onClick={() => nav(t.path)}
            style={{
              flex: 1, padding: '10px 0 6px',
              background: 'none', border: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              color: active ? 'var(--accent)' : 'var(--text3)',
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
          >
            <t.icon size={20} active={active} />
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

function HomeIcon({ size, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M3 8.5L10 3l7 5.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V8.5z"
        stroke="currentColor" strokeWidth={active ? 1.8 : 1.4} fill={active ? 'currentColor' : 'none'} fillOpacity={0.15}
        strokeLinejoin="round" />
      <path d="M7 18v-6h6v6" stroke="currentColor" strokeWidth={active ? 1.8 : 1.4} strokeLinejoin="round" />
    </svg>
  )
}
function TaskIcon({ size, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="3" y="3" width="14" height="14" rx="3"
        stroke="currentColor" strokeWidth={active ? 1.8 : 1.4} fill={active ? 'currentColor' : 'none'} fillOpacity={0.1} />
      <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
    </svg>
  )
}
function CalIcon({ size, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="13" rx="2.5"
        stroke="currentColor" strokeWidth={active ? 1.8 : 1.4} fill={active ? 'currentColor' : 'none'} fillOpacity={0.1} />
      <path d="M3 8h14" stroke="currentColor" strokeWidth={1.4} />
      <path d="M7 2v3M13 2v3" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
      <circle cx="10" cy="12" r="1.2" fill="currentColor" />
    </svg>
  )
}
function CanvasIcon({ size, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7"
        stroke="currentColor" strokeWidth={active ? 1.8 : 1.4} fill={active ? 'currentColor' : 'none'} fillOpacity={0.1} />
      <path d="M6 10 C6 7.8 7.8 6 10 6 C12.2 6 14 7.8 14 10 C14 12.2 12.2 14 10 14"
        stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" fill="none" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
    </svg>
  )
}
