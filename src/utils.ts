import { Env, LoggedMessage } from './types'

export const API_URL = 'https://propaganda-production.up.railway.app/api/send/'

export const logMessages = async (groups: any[], scheduled: number, env: Env) => {
  for (const g of groups) {
    for (const conv of g.conversations || []) {
      for (const msg of conv.messages || []) {
        const entry: LoggedMessage = {
          group_id: g.group_id,
          conversation_id: conv.conversation_id,
          sender_id: msg.sender_id,
          message_content: msg.message_content,
          timestamp: Date.now(),
          scheduled_for: scheduled,
          reply_to: msg.reply_to,
        }
        await env.MESSAGE_KV.put(
          `message:${g.group_id}:${Date.now()}:${crypto.randomUUID()}`,
          JSON.stringify(entry)
        )
      }
    }
  }
}
