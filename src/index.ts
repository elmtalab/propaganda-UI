import { Hono } from 'hono'

// Cloudflare Worker that stores user messages in KV and posts them
// to the propaganda API when the scheduled cron fires.

// Bindings available to the worker. Wrangler maps each KV namespace
// to a variable we can access in code.
export interface Env {
  SCHEDULE_KV: KVNamespace
  SYSTEM_META_KV: KVNamespace
  GROUP_KV: KVNamespace
  GROUP_MEMBERS_KV: KVNamespace
  CONVERSATION_KV: KVNamespace
  MESSAGE_KV: KVNamespace
  AI_USER_KV: KVNamespace
  AUDIT_LOG_KV: KVNamespace
}

// Shape of a scheduled task stored in KV
interface SchedulePayload {
  groups: Array<{
    group_id: string
    conversations: Array<{
      messages: Array<{
        sender_id: string
        message_content: string
        reply_to?: string
      }>
    }>
  }>
  // Unix timestamp (milliseconds) when the message should be sent
  send_at: number
}

// Endpoint that ultimately receives the scheduled messages
const API_URL = 'https://propaganda-production.up.railway.app/api/send/'

// Create a minimal Hono application to handle HTTP routes
const app = new Hono<{ Bindings: Env }>()

app.get('/', c => {
  // Simple form UI to schedule a message
  const html = `<!DOCTYPE html>
  <html>
  <body>
    <h1>Schedule Message</h1>
    <form method="POST" action="/schedule">
      <label>Group ID: <input name="group_id" /></label><br/>
      <label>Sender ID: <input name="sender_id" /></label><br/>
      <label>Message: <input name="message" /></label><br/>
      <label>Send At (ISO timestamp): <input name="send_at" /></label><br/>
      <button type="submit">Schedule</button>
    </form>
  </body>
  </html>`
  return c.html(html)
})

app.post('/schedule', async c => {
  // Parse and validate form data then persist the task in KV
  const body = await c.req.parseBody()
  const group_id = body["group_id"]?.toString() || ''
  const sender_id = body["sender_id"]?.toString() || ''
  const message = body["message"]?.toString() || ''
  const send_at = Date.parse(body["send_at"]?.toString() || '')
  if (!group_id || !sender_id || !message || isNaN(send_at)) {
    return c.json({ error: 'Invalid input' }, 400)
  }

  // Construct the task object that mirrors the API payload
  const task: SchedulePayload = {
    groups: [
      {
        group_id,
        conversations: [
          {
            messages: [
              {
                sender_id,
                message_content: message
              }
            ]
          }
        ]
      }
    ],
    send_at
  }

  // Use a random UUID as the task key in KV
  const id = crypto.randomUUID()
  await c.env.SCHEDULE_KV.put(`task:${id}`, JSON.stringify(task))
  return c.json({ status: 'scheduled', id })
})

// Export the app to let Wrangler handle requests
export default app

// Cron handler executed once a minute as configured in wrangler.toml
export const scheduled = async (event: ScheduledController, env: Env, ctx: ExecutionContext) => {
  const now = Date.now()
  // Look for all pending tasks
  const list = await env.SCHEDULE_KV.list({ prefix: 'task:' })
  for (const key of list.keys) {
    const task = await env.SCHEDULE_KV.get(key.name, { type: 'json' }) as SchedulePayload | null
    if (!task) continue
    // Send tasks whose time has arrived
    if (task.send_at <= now) {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups: task.groups })
      })
      // Remove the task once sent
      await env.SCHEDULE_KV.delete(key.name)
    }
  }
}
