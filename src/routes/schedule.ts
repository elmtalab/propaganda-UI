import { Hono } from 'hono'
import type { Env, SchedulePayload } from '../types'

export default function register(app: Hono<{ Bindings: Env }>) {
  app.post('/schedule', async c => {
    const body = await c.req.parseBody()
    const group_id = body['group_id']?.toString() || ''
    const sender_id = body['sender_id']?.toString() || ''
    const message = body['message']?.toString() || ''
    const send_at = Date.parse(body['send_at']?.toString() || '')
    if (!group_id || !sender_id || !message || isNaN(send_at)) {
      return c.json({ error: 'Invalid input' }, 400)
    }
    const task: SchedulePayload = {
      groups: [
        {
          group_id,
          conversations: [
            {
              messages: [
                {
                  sender_id,
                  message_content: message,
                },
              ],
            },
          ],
        },
      ],
      send_at,
    }
    const id = crypto.randomUUID()
    await c.env.SCHEDULE_KV.put(`task:${id}`, JSON.stringify(task))
    return c.json({ status: 'scheduled', id })
  })
}
