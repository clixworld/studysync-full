import { useState, useEffect, useCallback } from 'react'
import { format, addDays } from 'date-fns'
import { fetchSchedule, createSlot, deleteSlot, syncSchedule, isConnected } from '../lib/api'

export function useSchedule() {
  const [slots, setSlots]     = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError]     = useState(null)

  useEffect(() => { if (isConnected()) load() }, [])

  async function load() {
    try {
      setLoading(true)
      const data = await fetchSchedule()
      setSlots(data)
    } catch (e) { setError(e.message) }
    finally     { setLoading(false) }
  }

  const getSlotsForDate = useCallback((dateStr) =>
    slots
      .filter(s => s.date === dateStr)
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
  , [slots])

  const getDayWindow = useCallback(() =>
    Array.from({ length: 14 }, (_, i) => {
      const date    = addDays(new Date(), i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const day     = slots.filter(s => s.date === dateStr)
      return {
        date, dateStr,
        dayName:   format(date, 'EEE'),
        dayNum:    format(date, 'd'),
        hasEvents: day.some(s => s.type !== 'free'),
        count:     day.filter(s => s.type !== 'free').length,
      }
    })
  , [slots])

  const add = useCallback(async (slotData) => {
    const tempId = 'tmp-' + Math.random().toString(36).slice(2)
    const optimistic = { id: tempId, ...slotData, start_time: slotData.start, end_time: slotData.end, subtitle: slotData.sub }
    setSlots(p => [...p, optimistic])
    try {
      const saved = await createSlot(slotData)
      setSlots(p => p.map(s => s.id === tempId ? saved : s))
    } catch (e) {
      setSlots(p => p.filter(s => s.id !== tempId))
      setError(e.message)
    }
  }, [])

  const remove = useCallback(async (id) => {
    const backup = slots.find(s => s.id === id)
    setSlots(p => p.filter(s => s.id !== id))
    try { await deleteSlot(id) }
    catch (e) { setSlots(p => [...p, backup]); setError(e.message) }
  }, [slots])

  const sync = useCallback(async () => {
    try {
      setSyncing(true)
      await syncSchedule()
      await load()
    } catch (e) { setError(e.message) }
    finally     { setSyncing(false) }
  }, [])

  return { slots, loading, syncing, error, getSlotsForDate, getDayWindow, add, remove, sync, refresh: load }
}
