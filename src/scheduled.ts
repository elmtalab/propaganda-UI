import type { Env, SchedulePayload, AdvancedMessageTask } from './types'
import { API_URL, logMessages } from './utils'

export const scheduled = async (_event: ScheduledController, env: Env, _ctx: ExecutionContext) => {
  const now = Date.now()
  const list = await env.SCHEDULE_KV.list({ prefix: 'task:' })
  for (const key of list.keys) {
    const data = await env.SCHEDULE_KV.get(key.name, { type: 'json' }) as any
    if (!data) continue

    const send = async (groups: any, scheduledFor: number) => {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups })
      })
      await logMessages(groups, scheduledFor, env)
      await env.SCHEDULE_KV.delete(key.name)
    }

    if ('groups' in data) {
      const task = data as SchedulePayload
      if (task.send_at <= now) {
        await send(task.groups, task.send_at)
      }
    } else if ('group_id' in data && 'message' in data) {
      const task = data as AdvancedMessageTask
      if (task.send_at <= now) {
        await send([
          {
            group_id: task.group_id,
            conversations: [
              {
                messages: [task.message]
              }
            ]
          }
        ], task.send_at)
      }
    }
  }
}
