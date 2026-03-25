import { useState, useEffect, useCallback } from 'react'
import { fetchAnnouncements, fetchPlanner, fetchCourses, fetchTasks, syncTasks, toggleTask, deleteTask, createTask, isConnected } from '../lib/api'

export function useCanvas() {
  const [announcements, setAnnouncements] = useState([])
  const [tasks,         setTasks]         = useState([])
  const [courses,       setCourses]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [syncing,       setSyncing]       = useState(false)

  useEffect(() => { if (isConnected()) loadAll() }, [])

  async function loadAll() {
    try {
      setLoading(true)
      const [ann, taskList, courseList] = await Promise.all([
        fetchAnnouncements(),
        fetchTasks(),
        fetchCourses(),
      ])
      setAnnouncements(ann)
      setTasks(taskList)
      setCourses(courseList)
    } catch (e) { console.error(e) }
    finally     { setLoading(false) }
  }

  // Announcements with detected dates that haven't been dismissed
  const pendingAlerts = announcements.filter(a => a.detectedDates?.length > 0 && !a.dismissed)

  function dismiss(id) {
    setAnnouncements(p => p.map(a => a.id === id ? { ...a, dismissed: true } : a))
  }

  // Tasks due in next 3 days
  const urgentTasks = tasks.filter(t => {
    if (!t.due_date || t.completed) return false
    const diff = (new Date(t.due_date) - new Date()) / 86400000
    return diff >= 0 && diff <= 3
  })

  const toggle = useCallback(async (id, completed) => {
    setTasks(p => p.map(t => t.id === id ? { ...t, completed } : t))
    try { await toggleTask(id, completed) }
    catch (e) { setTasks(p => p.map(t => t.id === id ? { ...t, completed: !completed } : t)) }
  }, [])

  const remove = useCallback(async (id) => {
    const backup = tasks.find(t => t.id === id)
    setTasks(p => p.filter(t => t.id !== id))
    try { await deleteTask(id) }
    catch (e) { setTasks(p => [...p, backup]) }
  }, [tasks])

  const add = useCallback(async (task) => {
    const saved = await createTask(task)
    setTasks(p => [...p, saved])
    return saved
  }, [])

  const sync = useCallback(async () => {
    try {
      setSyncing(true)
      await syncTasks()
      await loadAll()
    } catch (e) { console.error(e) }
    finally     { setSyncing(false) }
  }, [])

  return {
    announcements, tasks, courses, loading, syncing,
    pendingAlerts, urgentTasks,
    dismiss, toggle, remove, add, sync,
    refresh: loadAll,
  }
}
