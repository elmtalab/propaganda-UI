import { Hono } from 'hono'
import type { Env } from '../types'

export default function register(app: Hono<{ Bindings: Env }>) {
  app.get('/history/:group', async c => {
    const group = c.req.param('group')
    const list = await c.env.MESSAGE_KV.list({ prefix: `message:${group}:` })
    const messages = [] as any[]
    for (const k of list.keys) {
      const m = await c.env.MESSAGE_KV.get(k.name, { type: 'json' })
      if (m) messages.push(m)
    }
    return c.json({ group, messages })
  })
}
