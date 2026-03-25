const axios = require('axios')

/**
 * Build an authenticated Canvas API client for a given user.
 * Uses personal token in dev, access token from DB in production.
 */
function canvasClient(accessToken) {
  const baseURL = process.env.CANVAS_BASE_URL + '/api/v1'
  return axios.create({
    baseURL,
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

/** Get the token to use — personal token in dev, user token in prod */
function getToken(userToken) {
  return process.env.CANVAS_PERSONAL_TOKEN || userToken
}

/** Fetch all active courses for a user */
async function getCourses(userToken) {
  const client = canvasClient(getToken(userToken))
  const { data } = await client.get('/courses', {
    params: { enrollment_state: 'active', per_page: 50 },
  })
  return data.filter(c => c.name) // filter out unnamed/concluded
}

/**
 * Fetch planner items (assignments + to-dos) from today forward.
 * Returns normalized array of { id, title, dueDate, courseName, type }
 */
async function getPlannerItems(userToken) {
  const client = canvasClient(getToken(userToken))
  const startDate = new Date().toISOString()
  const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await client.get('/planner/items', {
    params: { start_date: startDate, end_date: endDate, per_page: 100 },
  })

  return data.map(item => ({
    id: item.plannable_id?.toString(),
    title: item.plannable?.title || item.plannable_type,
    dueDate: item.plannable_date,
    courseName: item.context_name || 'Personal',
    type: item.plannable_type, // 'assignment', 'quiz', 'discussion_topic', etc.
    completed: item.submissions?.submitted || false,
    url: item.html_url,
  }))
}

/**
 * Fetch recent announcements across all courses.
 * Returns normalized array of { id, title, body, postedAt, courseName }
 */
async function getAnnouncements(userToken) {
  const client = canvasClient(getToken(userToken))

  // First get course IDs
  const courses = await getCourses(userToken)
  if (!courses.length) return []

  const contextCodes = courses.map(c => `course_${c.id}`)

  const { data } = await client.get('/announcements', {
    params: {
      context_codes: contextCodes,
      per_page: 30,
      // Only last 14 days of announcements
      start_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
  })

  return data.map(a => ({
    id: a.id?.toString(),
    title: a.title,
    body: a.message?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(), // strip HTML
    postedAt: a.posted_at,
    courseName: courses.find(c => c.id === a.context_code?.replace('course_', '') * 1)?.name || 'Course',
  }))
}

module.exports = { getCourses, getPlannerItems, getAnnouncements }
