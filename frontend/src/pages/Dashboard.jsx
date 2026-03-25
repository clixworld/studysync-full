import { useNavigate } from 'react-router-dom'
import { format, isToday, isTomorrow } from 'date-fns'
import { useCanvas } from '../hooks/useCanvas'
import { useSchedule } from '../hooks/useSchedule'
import AnnouncementAlert from '../components/AnnouncementAlert'
import { createSlot, getUserName } from '../lib/api'

export default function Dashboard() {
  const { tasks, pendingAlerts, urgentTasks, dismiss, toggle, loading, sync, syncing } = useCanvas()
  const { getSlotsForDate } = useSchedule()
  const nav = useNavigate()
  const name = getUserName() || 'there'
  const today = format(new Date(), 'yyyy-MM-dd')
  const todaySlots = getSlotsForDate(today).filter(s => s.type !== 'free')

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  async function handleAddToCalendar(alert) {
    for (const d of alert.detectedDates) {
      await createSlot({
        date: d.date,
        title: d.description,
        subtitle: alert.courseName,
        type: 'canvas',
        start: null, end: null,
      })
    }
    dismiss(alert.id)
  }

  const upcoming = tasks
    .filter(t => !t.completed && t.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 4)

  function dueLabel(d) {
    const date = new Date(d)
    if (isToday(date))    return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'MMM d')
  }

  function isUrgent(d) {
    const diff = (new Date(d) - new Date()) / 86400000
    return diff >= 0 && diff <= 2
  }

  return (
    <div className="page-enter" style={{ flex: 1, overflowY: 'auto', padding: '20px 18px 0' }}>

      {/* Greeting */}
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
          {greeting()}, {name.split(' ')[0]}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text2)' }}>
          {format(new Date(), 'EEEE, MMMM d')} · {urgentTasks.length > 0 ? `${urgentTasks.length} item${urgentTasks.length > 1 ? 's' : ''} due soon` : 'All caught up!'}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8, marginBottom: 18 }}>
        {[
          { num: todaySlots.length, label: 'Today',     color: 'var(--accent)',      onClick: () => nav('/schedule') },
          { num: urgentTasks.length, label: 'Due soon', color: urgentTasks.length > 0 ? 'var(--danger)' : 'var(--canvas-color)', onClick: () => nav('/tasks') },
          { num: pendingAlerts.length, label: 'Alerts', color: pendingAlerts.length > 0 ? 'var(--warning)' : 'var(--text3)', onClick: null },
        ].map(c => (
          <div
            key={c.label}
            onClick={c.onClick}
            style={{
              background: 'var(--bg2)', borderRadius: 'var(--radius)', padding: '12px 10px',
              textAlign: 'center', cursor: c.onClick ? 'pointer' : 'default',
              transition: 'transform 0.2s', border: '0.5px solid var(--border)',
            }}
            onMouseOver={e => c.onClick && (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <div style={{ fontSize: 24, fontWeight: 600, color: c.color }}>{loading ? '–' : c.num}</div>
            <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Canvas alerts */}
      {pendingAlerts.length > 0 && (
        <>
          <SectionLabel label="Canvas alerts" />
          {pendingAlerts.map(a => (
            <AnnouncementAlert key={a.id} alert={a} onAddToCalendar={handleAddToCalendar} onDismiss={dismiss} />
          ))}
        </>
      )}

      {/* Today's schedule preview */}
      {todaySlots.length > 0 && (
        <>
          <SectionLabel label="Today's blocks" action="View all" onAction={() => nav('/schedule')} />
          {todaySlots.slice(0, 3).map(s => (
            <div key={s.id} className={`slot-${s.type}`} style={{ padding: '9px 12px', marginBottom: 6, borderRadius: '0 var(--radius) var(--radius) 0', borderLeft: '3px solid' }}>
              <p className="slot-title" style={{ fontSize: 13, fontWeight: 500 }}>{s.title}</p>
              {s.subtitle && <p className="slot-sub" style={{ fontSize: 11, marginTop: 2 }}>{s.subtitle}</p>}
            </div>
          ))}
        </>
      )}

      {/* Upcoming tasks */}
      <SectionLabel label="Coming up" action="All tasks" onAction={() => nav('/tasks')} />
      {loading ? (
        [1,2,3].map(n => <div key={n} className="skeleton" style={{ height: 52, marginBottom: 6, animationDelay: `${n*0.08}s` }} />)
      ) : upcoming.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text3)', padding: '10px 0 24px' }}>No upcoming tasks — nice!</p>
      ) : (
        <>
          {upcoming.map(task => (
            <TaskRow key={task.id} task={task} dueLabel={dueLabel} isUrgent={isUrgent} onToggle={toggle} />
          ))}
          <div style={{ height: 20 }} />
        </>
      )}
    </div>
  )
}

function SectionLabel({ label, action, onAction }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      {action && <button onClick={onAction} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', fontWeight: 500 }}>{action}</button>}
    </div>
  )
}

function TaskRow({ task, dueLabel, isUrgent, onToggle }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 0', borderBottom: '0.5px solid var(--border)',
    }}>
      <button
        onClick={() => onToggle(task.id, !task.completed)}
        style={{
          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
          border: `1.5px solid ${task.completed ? 'var(--canvas-color)' : 'var(--border2)'}`,
          background: task.completed ? 'var(--canvas-color)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}
      >
        {task.completed && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </button>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, color: 'var(--text)', textDecoration: task.completed ? 'line-through' : 'none', opacity: task.completed ? 0.5 : 1 }}>{task.title}</p>
        <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
          {task.course_name && <span style={{ fontSize: 10, color: 'var(--text3)' }}>{task.course_name}</span>}
          {task.due_date && (
            <span style={{
              fontSize: 10, fontWeight: 500,
              color: isUrgent(task.due_date) ? 'var(--danger)' : 'var(--text2)',
            }}>
              {dueLabel(task.due_date)}
            </span>
          )}
        </div>
      </div>
      {task.source === 'canvas' && (
        <span style={{ fontSize: 9, padding: '2px 7px', background: 'var(--canvas-light)', color: '#0F6E56', borderRadius: 99, fontWeight: 600 }}>Canvas</span>
      )}
    </div>
  )
}
