require('dotenv').config()
const express = require('express')
const cors = require('cors')
const axios = require('axios')
const { createClient } = require('@supabase/supabase-js')
const { getCourses, getPlannerItems, getAnnouncements } = require('./canvasApi')
const { extractDatesFromAnnouncement } = require('./announcementParser')

const app = express()
app.use(cors({ origin: 'http://localhost:3000' }))
app.use(express.json())

// Supabase admin client (uses service role key — never expose this to frontend)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// ── Auth middleware ───────────────────────────────────────────────
// Reads x-user-id header set by frontend on every request
function requireUser(req, res, next) {
  // In dev with personal token, use a fixed test user ID
  if (process.env.CANVAS_PERSONAL_TOKEN) {
    req.userId = 'dev-user'
    req.accessToken = process.env.CANVAS_PERSONAL_TOKEN
    return next()
  }
  const userId = req.headers['x-user-id']
  if (!userId) return res.status(401).json({ error: 'Not authenticated' })
  req.userId = userId
  next()
}

// Load user's access token from DB (skipped in dev mode)
async function loadToken(req, res, next) {
  if (req.accessToken) return next() // already set (dev mode)
  const { data } = await supabase
    .from('users')
    .select('access_token')
    .eq('canvas_user_id', req.userId)
    .single()
  if (!data) return res.status(401).json({ error: 'User not found' })
  req.accessToken = data.access_token
  next()
}

// ── Canvas OAuth ──────────────────────────────────────────────────

// Exchange auth code for Canvas access token
app.post('/auth/canvas/token', async (req, res) => {
  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'Missing code' })

  try {
    const response = await axios.post(
      `${process.env.CANVAS_BASE_URL}/login/oauth2/token`,
      {
        grant_type: 'authorization_code',
        client_id: process.env.CANVAS_CLIENT_ID,
        client_secret: process.env.CANVAS_CLIENT_SECRET,
        redirect_uri: 'http://localhost:3000/auth/callback',
        code,
      }
    )

    const { access_token, refresh_token, user } = response.data

    // Upsert user into Supabase
    await supabase.from('users').upsert({
      canvas_user_id: user.id.toString(),
      name: user.name,
      access_token,
      refresh_token,
      updated_at: new Date().toISOString(),
    })

    res.json({ userId: user.id.toString(), name: user.name })
  } catch (err) {
    console.error('OAuth error:', err.response?.data || err.message)
    res.status(500).json({ error: 'OAuth token exchange failed' })
  }
})

// ── Canvas API routes ─────────────────────────────────────────────

app.get('/api/courses', requireUser, loadToken, async (req, res) => {
  try {
    const courses = await getCourses(req.accessToken)
    res.json(courses)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/planner', requireUser, loadToken, async (req, res) => {
  try {
    const items = await getPlannerItems(req.accessToken)
    res.json(items)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/announcements', requireUser, loadToken, async (req, res) => {
  try {
    const announcements = await getAnnouncements(req.accessToken)

    // Parse dates from each announcement using Claude
    const withDates = await Promise.all(
      announcements.map(async a => {
        const detectedDates = await extractDatesFromAnnouncement(a.body, a.courseName)
        return { ...a, detectedDates }
      })
    )

    res.json(withDates)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Schedule routes ───────────────────────────────────────────────

// Get all schedule slots for a user (next 30 days)
app.get('/api/schedule', requireUser, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('schedule_slots')
      .select('*')
      .eq('user_id', req.userId)
      .gte('date', today)
      .order('date').order('start_time')
    if (error) throw error
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Add a schedule slot
app.post('/api/schedule', requireUser, async (req, res) => {
  try {
    const { date, start, end, title, subtitle, type, canvasItemId } = req.body
    const { data, error } = await supabase
      .from('schedule_slots')
      .insert({
        user_id: req.userId,
        date,
        start_time: start || null,
        end_time: end || null,
        title,
        subtitle: subtitle || null,
        type: type || 'study',
        canvas_item_id: canvasItemId || null,
      })
      .select()
      .single()
    if (error) throw error
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Delete a schedule slot
app.delete('/api/schedule/:id', requireUser, async (req, res) => {
  try {
    const { error } = await supabase
      .from('schedule_slots')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId) // security: can only delete own slots
    if (error) throw error
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Sync Canvas planner items → schedule (upserts, no duplicates)
app.post('/api/schedule/sync', requireUser, loadToken, async (req, res) => {
  try {
    const items = await getPlannerItems(req.accessToken)
    const slots = items
      .filter(item => item.dueDate)
      .map(item => ({
        user_id: req.userId,
        date: item.dueDate.slice(0, 10),
        start_time: item.dueDate.slice(11, 16) || null,
        end_time: null,
        title: item.title,
        subtitle: item.courseName,
        type: 'canvas',
        canvas_item_id: item.id,
      }))

    if (slots.length) {
      const { error } = await supabase
        .from('schedule_slots')
        .upsert(slots, { onConflict: 'canvas_item_id' })
      if (error) throw error
    }

    res.json({ synced: slots.length })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Tasks routes ──────────────────────────────────────────────────

app.get('/api/tasks', requireUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', req.userId)
      .order('due_date')
    if (error) throw error
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/tasks', requireUser, async (req, res) => {
  try {
    const { title, courseName, dueDate, source, canvasItemId } = req.body
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: req.userId,
        title,
        course_name: courseName || null,
        due_date: dueDate || null,
        source: source || 'manual',
        canvas_item_id: canvasItemId || null,
      })
      .select()
      .single()
    if (error) throw error
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.patch('/api/tasks/:id', requireUser, async (req, res) => {
  try {
    const { completed } = req.body
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed })
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select()
      .single()
    if (error) throw error
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/tasks/:id', requireUser, async (req, res) => {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
    if (error) throw error
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Sync Canvas planner → tasks
app.post('/api/tasks/sync', requireUser, loadToken, async (req, res) => {
  try {
    const items = await getPlannerItems(req.accessToken)
    const tasks = items.map(item => ({
      user_id: req.userId,
      title: item.title,
      course_name: item.courseName,
      due_date: item.dueDate || null,
      source: 'canvas',
      canvas_item_id: item.id,
      completed: item.completed,
    }))

    if (tasks.length) {
      const { error } = await supabase
        .from('tasks')
        .upsert(tasks, { onConflict: 'canvas_item_id' })
      if (error) throw error
    }

    res.json({ synced: tasks.length })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Health check ──────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`\n🎓 StudySync backend running on http://localhost:${PORT}`)
  console.log(`   Dev mode: ${process.env.CANVAS_PERSONAL_TOKEN ? '✅ using personal Canvas token' : '❌ no token set'}`)
  console.log(`   Supabase: ${process.env.SUPABASE_URL ? '✅ connected' : '❌ not configured'}\n`)
})
