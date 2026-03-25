const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * Parse an announcement body for important dates using Claude.
 * Returns array of { date, description } objects.
 *
 * Example:
 *   input:  "Quiz 3 moved to April 2nd. Project due April 10th by midnight."
 *   output: [
 *     { date: "2026-04-02", description: "Quiz 3" },
 *     { date: "2026-04-10", description: "Project due" }
 *   ]
 */
async function extractDatesFromAnnouncement(text, courseName = '') {
  if (!text || text.length < 20) return []

  // Don't call API if no date-like patterns exist
  const hasDatePattern = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\/\d{1,2}|monday|tuesday|wednesday|thursday|friday|due|deadline|exam|quiz|midterm|final)\b/i.test(text)
  if (!hasDatePattern) return []

  try {
    const today = new Date().toISOString().slice(0, 10)
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Today is ${today}. Extract all important dates and deadlines from this course announcement.

Course: ${courseName}
Announcement: "${text}"

Respond ONLY with a JSON array. Each item must have:
- "date": ISO format (YYYY-MM-DD), null if unclear
- "description": short label like "Quiz 3" or "Project due"

Example: [{"date":"2026-04-02","description":"Quiz 3"},{"date":"2026-04-10","description":"Project due midnight"}]

If no dates found, return: []
Return ONLY the JSON array, no other text.`,
      }],
    })

    const raw = response.content[0].text.trim()
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(d => d.date) : []
  } catch (e) {
    console.error('Date parser error:', e.message)
    return []
  }
}

module.exports = { extractDatesFromAnnouncement }
