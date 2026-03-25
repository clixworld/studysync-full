import { useState, useRef, useEffect } from 'react'
import { format, addDays } from 'date-fns'
import { useSchedule } from '../hooks/useSchedule'

const HOURS = Array.from({ length: 14 }, (_, i) => {
  const h = i + 8
  return { label: h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`, value: h }
})
const TYPES = {
  canvas:   { label: 'Canvas',      color: 'var(--canvas-color)'   },
  study:    { label: 'Study block', color: 'var(--study-color)'    },
  personal: { label: 'Personal',    color: 'var(--personal-color)' },
}

export default function Schedule() {
  const { loading, syncing, getSlotsForDate, getDayWindow, add, remove, sync } = useSchedule()
  const [selDay,    setSelDay]    = useState(0)
  const [expanded,  setExpanded]  = useState(null)
  const [removing,  setRemoving]  = useState(null)
  const [modal,     setModal]     = useState(false)
  const [form,      setForm]      = useState({ title: '', type: 'study', start: '09:00', end: '10:00', sub: '' })
  const stripRef = useRef(null)

  const days     = getDayWindow()
  const dateStr  = format(addDays(new Date(), selDay), 'yyyy-MM-dd')
  const daySlots = getSlotsForDate(dateStr)

  useEffect(() => {
    stripRef.current?.children[selDay]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [selDay])

  function openModal(h = '') {
    if (h !== '') {
      const hh = h.toString().padStart(2, '0')
      const eh = (parseInt(h) + 1).toString().padStart(2, '0')
      setForm(f => ({ ...f, start: `${hh}:00`, end: `${eh}:00` }))
    }
    setModal(true)
  }

  async function save() {
    if (!form.title.trim()) return
    await add({ date: dateStr, start: form.start, end: form.end, title: form.title.trim(), sub: form.sub.trim(), type: form.type })
    setForm({ title: '', type: 'study', start: '09:00', end: '10:00', sub: '' })
    setModal(false)
  }

  async function del(e, id) {
    e.stopPropagation()
    setRemoving(id)
    setTimeout(async () => { await remove(id); setRemoving(null); if (expanded === id) setExpanded(null) }, 220)
  }

  const dayLabel = selDay === 0 ? 'Today' : selDay === 1 ? 'Tomorrow' : format(addDays(new Date(), selDay), 'EEE, MMM d')
  const blockCount = daySlots.filter(s => s.type !== 'free').length

  return (
    <div className="page-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '18px 18px 0', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>Schedule</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={sync}
              style={{
                fontSize: 12, padding: '6px 13px', borderRadius: 99,
                border: '0.5px solid var(--border2)', background: 'none', color: 'var(--text2)',
                transition: 'all 0.2s', fontFamily: 'var(--font)',
                ...(syncing ? { animation: 'spin 0.8s linear infinite' } : {}),
              }}
            >
              {syncing ? '⟳' : '↻'} Sync
            </button>
            <button
              onClick={() => modal ? setModal(false) : openModal()}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: modal ? 'var(--danger)' : 'var(--accent)',
                color: '#fff', border: 'none', fontSize: 22, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'transform 0.3s cubic-bezier(.34,1.56,.64,1), background 0.2s',
                transform: modal ? 'rotate(45deg)' : 'none',
              }}
            >+</button>
          </div>
        </div>

        {/* Day strip */}
        <div ref={stripRef} style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 14, scrollbarWidth: 'none' }}>
          {days.map((day, i) => (
            <button key={day.dateStr} onClick={() => { setSelDay(i); setExpanded(null) }}
              style={{
                flexShrink: 0, minWidth: 50, display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '8px 11px', borderRadius: 14, border: `0.5px solid ${i === selDay ? 'var(--accent)' : 'var(--border)'}`,
                background: i === selDay ? 'var(--accent)' : 'var(--bg)',
                transform: i === selDay ? 'translateY(-3px) scale(1.05)' : 'none',
                transition: 'all 0.25s cubic-bezier(.34,1.56,.64,1)', cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 500, color: i === selDay ? 'rgba(255,255,255,0.75)' : 'var(--text2)', letterSpacing: '0.04em' }}>{day.dayName}</span>
              <span style={{ fontSize: 17, fontWeight: 500, color: i === selDay ? '#fff' : 'var(--text)', marginTop: 2 }}>{day.dayNum}</span>
              <span style={{ width: 5, height: 5, borderRadius: '50%', marginTop: 4, background: i === selDay ? 'rgba(255,255,255,0.7)' : 'var(--accent)', opacity: day.hasEvents || i === selDay ? 1 : 0, transition: 'opacity 0.2s' }} />
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', scrollbarWidth: 'thin' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0 10px', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{dayLabel}</span>
          {blockCount > 0 && <span style={{ fontSize: 10, background: 'var(--accent-light)', color: 'var(--accent)', padding: '3px 10px', borderRadius: 99, fontWeight: 600 }}>{blockCount} block{blockCount > 1 ? 's' : ''}</span>}
        </div>

        {loading ? (
          [1,2,3,4].map(n => <div key={n} className="skeleton" style={{ height: 48, marginBottom: 6, animationDelay: `${n*0.08}s` }} />)
        ) : (
          HOURS.map(({ label, value }) => {
            const t = value.toString().padStart(2, '0') + ':00'
            const matching = daySlots.filter(s => s.start_time === t)
            return (
              <div key={value} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}>
                <span style={{ width: 34, flexShrink: 0, fontSize: 10, color: 'var(--text3)', paddingTop: 12, textAlign: 'right' }}>{label}</span>
                <div style={{ flex: 1 }}>
                  {matching.length > 0 ? matching.map(slot => (
                    <div
                      key={slot.id}
                      className={`slot-${slot.type}`}
                      onClick={() => setExpanded(expanded === slot.id ? null : slot.id)}
                      style={{
                        padding: '9px 12px', marginBottom: 4, cursor: 'pointer',
                        animation: removing === slot.id ? 'fadeOut 0.22s both' : 'slideIn 0.3s cubic-bezier(.34,1.56,.64,1) both',
                        transition: 'transform 0.2s cubic-bezier(.34,1.56,.64,1)',
                      }}
                      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.015)'}
                      onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <p className="slot-title" style={{ fontSize: 13, fontWeight: 500 }}>{slot.title}</p>
                      {slot.subtitle && <p className="slot-sub" style={{ fontSize: 11, marginTop: 2, opacity: 0.75 }}>{slot.subtitle}</p>}
                      {slot.start_time && slot.end_time && <p style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }} className="slot-sub">{slot.start_time?.slice(0,5)} – {slot.end_time?.slice(0,5)}</p>}
                      {expanded === slot.id && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, animation: 'slideIn 0.2s both' }}>
                          <button onClick={e => del(e, slot.id)} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 99, border: '0.5px solid var(--danger)', color: 'var(--danger)', background: 'none', fontWeight: 500, transition: 'background 0.15s' }}>Remove</button>
                          <button onClick={e => { e.stopPropagation(); openModal(value) }} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 99, border: '0.5px solid var(--border2)', color: 'var(--text2)', background: 'none' }}>Move time</button>
                        </div>
                      )}
                    </div>
                  )) : (
                    <button
                      onClick={() => openModal(value)}
                      style={{
                        width: '100%', border: '0.5px dashed var(--border2)', borderRadius: 12,
                        padding: '10px 14px', background: 'none', color: 'var(--text3)',
                        fontSize: 11, textAlign: 'left', transition: 'all 0.2s', marginBottom: 4,
                        fontFamily: 'var(--font)',
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-light)' }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'none' }}
                    >
                      + Add at {label}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, padding: '10px 18px 14px', borderTop: '0.5px solid var(--border)', flexWrap: 'wrap' }}>
        {Object.entries(TYPES).map(([k, v]) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text2)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: v.color }} />
            {v.label}
          </span>
        ))}
      </div>

      {/* Add modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h2 className="sheet-title">Add to schedule</h2>
            <label className="field-label">Title</label>
            <input className="field-input" type="text" placeholder="e.g. Study for quiz" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
            <label className="field-label">Type</label>
            <div className="type-row">
              {Object.entries(TYPES).map(([k, v]) => (
                <button key={k} className={`type-chip ${form.type === k ? `sel-${k}` : ''}`} onClick={() => setForm(f => ({ ...f, type: k }))}>{v.label}</button>
              ))}
            </div>
            <label className="field-label">Time</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="field-input" type="time" value={form.start} onChange={e => setForm(f => ({ ...f, start: e.target.value }))} />
              <span style={{ color: 'var(--text2)', fontSize: 13, flexShrink: 0 }}>to</span>
              <input className="field-input" type="time" value={form.end} onChange={e => setForm(f => ({ ...f, end: e.target.value }))} />
            </div>
            <label className="field-label">Note (optional)</label>
            <input className="field-input" type="text" placeholder="e.g. Chapter 9 reading" value={form.sub} onChange={e => setForm(f => ({ ...f, sub: e.target.value }))} />
            <button className="save-btn" onClick={save}>Add to schedule</button>
          </div>
        </div>
      )}
    </div>
  )
}
