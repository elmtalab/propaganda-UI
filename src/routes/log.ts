import { Hono } from 'hono'
import type { Env, LoggedMessage } from '../types'

export default function register(app: Hono<{ Bindings: Env }>) {
  app.post('/log', async c => {
    const body = await c.req.parseBody()
    const group_id = body['group_id']?.toString() || ''
    const sender_id = body['sender_id']?.toString() || ''
    const content = body['message_content']?.toString() || ''
    const send_at = Date.parse(body['send_at']?.toString() || '')
    const reply_to = body['reply_to']?.toString() || ''
    if (!group_id || !sender_id || !content) return c.json({ error: 'Invalid input' }, 400)
    const entry: LoggedMessage = { group_id, sender_id, message_content: content, timestamp: Date.now() }
    if (!isNaN(send_at)) entry.scheduled_for = send_at
    if (reply_to) entry.reply_to = reply_to
    await c.env.MESSAGE_KV.put(`message:${group_id}:${Date.now()}:${crypto.randomUUID()}`, JSON.stringify(entry))
    return c.json({ status: 'logged' })
  })
}
