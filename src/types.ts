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

export interface SchedulePayload {
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
  send_at: number
}

export interface AdvancedMessageTask {
  group_id: string
  conversation_id?: string
  message: {
    sender_id: string
    message_content: string
    reply_to?: string
  }
  send_at: number
}

export interface LoggedMessage {
  group_id: string
  conversation_id?: string
  sender_id: string
  message_content: string
  timestamp: number
  scheduled_for?: number
  reply_to?: string
}
