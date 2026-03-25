import { useState } from 'react'
import { format, isToday, isTomorrow, isPast } from 'date-fns'
import { useCanvas } from '../hooks/useCanvas'

const FILTERS = ['All', 'Today', 'Upcoming', 'Canvas', 'Done']

export default function Tasks() {
  const { tasks, loading, syncing, toggle, remove, add, sync } = useCanvas()
  const [filter,  setFilter]  = useState('All')
  const [modal,   setModal]   = useState(false)
  const [form,    setForm]    = useState({ title: '', dueDate: '', courseName: '' })
  const [removing, setRemoving] = useState(null)

  const filtered = tasks.filter(t => {
    if (filter === 'Done')     return t.completed
    if (filter === 'Canvas')   return t.source === 'canvas' && !t.completed
    if (filter === 'Today')    return !t.completed && t.due_date && isToday(new Date(t.due_date))
    if (filter === 'Upcoming') return !t.completed
    return true
  }).sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return new Date(a.due_date || '9999') - new Date(b.due_date || '9999')
  })

  async function handleAdd() {
    if (!form.title.trim()) return
    await add({ title: form.title.trim(), courseName: form.courseName, dueDate: form.dueDate || null, source: 'manual' })
    setForm({ title: '', dueDate: '', courseName: '' })
    setModal(false)
  }

  async function handleRemove(id) {
    setRemoving(id)
    setTimeout(async () => { await remove(id); setRemoving(null) }, 220)
  }

  function dueLabel(d) {
    if (!d) return null
    const date = new Date(d)
    if (isPast(date) && !isToday(date)) return { text: 'Overdue', color: 'var(--danger)' }
    if (isToday(date))    return { text: 'Today',    color: 'var(--warning)' }
    if (isTomorrow(date)) return { text: 'Tomorrow', color: 'var(--text2)' }
    return { text: format(date, 'MMM d'), color: 'var(--text3)' }
  }

  return (
    <div className="page-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '18px 18px 0', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>Tasks</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={sync} style={{ fontSize: 12, padding: '6px 13px', borderRadius: 99, border: '0.5px solid var(--border2)', background: 'none', color: 'var(--text2)', fontFamily: 'var(--font)', ...(syncing ? { animation: 'spin 0.8s linear infinite' } : {}) }}>
              {syncing ? '⟳' : '↻'} Sync
            </button>
            <button onClick={() => setModal(m => !m)} style={{ width: 34, height: 34, borderRadius: '50%', background: modal ? 'var(--danger)' : 'var(--accent)', color: '#fff', border: 'none', fontSize: 22, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.3s cubic-bezier(.34,1.56,.64,1), background 0.2s', transform: modal ? 'rotate(45deg)' : 'none' }}>+</button>
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 14, scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              flexShrink: 0, fontSize: 12, padding: '5px 14px', borderRadius: 99, fontWeight: 500,
              border: `0.5px solid ${f === filter ? 'var(--accent)' : 'var(--border)'}`,
              background: f === filter ? 'var(--accent)' : 'var(--bg)',
              color: f === filter ? '#fff' : 'var(--text2)',
              transition: 'all 0.2s', fontFamily: 'var(--font)',
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 18px 20px' }}>
        {loading ? (
          [1,2,3,4,5].map(n => <div key={n} className="skeleton" style={{ height: 52, marginBottom: 6, animationDelay: `${n*0.07}s` }} />)
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
            <p style={{ fontSize: 14 }}>{filter === 'Done' ? 'No completed tasks yet' : 'No tasks here!'}</p>
            <p style={{ fontSize: 12, marginTop: 6 }}>Tap ↻ Sync to pull from Canvas</p>
          </div>
        ) : (
          filtered.map(task => {
            const due = dueLabel(task.due_date)
            return (
              <div
                key={task.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '11px 0', borderBottom: '0.5px solid var(--border)',
                  animation: removing === task.id ? 'fadeOut 0.22s both' : 'slideIn 0.3s cubic-bezier(.34,1.56,.64,1) both',
                }}
              >
                <button
                  onClick={() => toggle(task.id, !task.completed)}
                  style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    border: `1.8px solid ${task.completed ? 'var(--canvas-color)' : 'var(--border2)'}`,
                    background: task.completed ? 'var(--canvas-color)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s cubic-bezier(.34,1.56,.64,1)',
                  }}
                >
                  {task.completed && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L4 7L9 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>

                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, color: 'var(--text)', textDecoration: task.completed ? 'line-through' : 'none', opacity: task.completed ? 0.45 : 1 }}>{task.title}</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                    {task.course_name && <span style={{ fontSize: 11, color: 'var(--text3)' }}>{task.course_name}</span>}
                    {due && <span style={{ fontSize: 11, fontWeight: 500, color: due.color }}>{due.text}</span>}
                    {task.source === 'canvas' && <span style={{ fontSize: 9, padding: '1px 7px', background: 'var(--canvas-light)', color: '#0F6E56', borderRadius: 99, fontWeight: 600 }}>Canvas</span>}
                  </div>
                </div>

                <button
                  onClick={() => handleRemove(task.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 16, padding: 4, cursor: 'pointer', opacity: 0.6, transition: 'opacity 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.opacity = 1}
                  onMouseOut={e => e.currentTarget.style.opacity = 0.6}
                >
                  ×
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Add modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h2 className="sheet-title">Add task</h2>
            <label className="field-label">Task</label>
            <input className="field-input" type="text" placeholder="e.g. Study for quiz" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
            <label className="field-label">Course (optional)</label>
            <input className="field-input" type="text" placeholder="e.g. ISYS 4385" value={form.courseName} onChange={e => setForm(f => ({ ...f, courseName: e.target.value }))} />
            <label className="field-label">Due date (optional)</label>
            <input className="field-input" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            <button className="save-btn" onClick={handleAdd}>Add task</button>
          </div>
        </div>
      )}
    </div>
  )
}
