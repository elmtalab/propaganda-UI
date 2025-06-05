import { Hono } from 'hono'
import type { Env, AdvancedMessageTask } from '../types'

const DEFAULT_JSON = `{
  "system_metadata": {
    "version": "1.0.1",
    "generated_at": "2025-06-05T01:45:00Z",
    "timezone": "UTC",
    "description": "Sample with two groups, two conversations and three AI users"
  },
  "groups": [
    {
      "group_id": "-1001876543210",
      "group_name": "Crypto Talk 🔥",
      "privacy_level": "public",
      "created_at": "2024-12-01T18:09:55Z",
      "created_by": 123456789,
      "group_description": "Daily chat about BTC, ETH, and alt-coins.",
      "members": [],
      "conversations": [
        {
          "conversation_id": "conv1",
          "messages": [
            {
              "sender_id": "987654321",
              "message_content": "Welcome to Crypto Talk!",
              "send_at": "2025-06-05T13:00:00Z"
            },
            {
              "sender_id": "876543210",
              "message_content": "Glad to be here.",
              "send_at": "2025-06-05T13:05:00Z"
            }
          ]
        }
      ]
    },
    {
      "group_id": "-1001234567890",
      "group_name": "Altcoin Updates",
      "privacy_level": "public",
      "created_at": "2024-11-20T15:42:10Z",
      "created_by": 987654321,
      "group_description": "Discuss the latest altcoin trends and news.",
      "members": [],
      "conversations": [
        {
          "conversation_id": "conv2",
          "messages": [
            {
              "sender_id": "765432109",
              "message_content": "Don't miss our daily market roundup!",
              "send_at": "2025-06-06T09:00:00Z"
            }
          ]
        }
      ]
    }
  ],
  "ai_users": [
    { "user_id": "987654321", "user_name": "CryptoBot", "role": "assistant", "status": "active" },
    { "user_id": "876543210", "user_name": "MarketBot", "role": "assistant", "status": "active" },
    { "user_id": "765432109", "user_name": "NewsBot", "role": "assistant", "status": "active" }
  ],
  "audit_log": []
}`

const HTML = `<!DOCTYPE html>
  <html>
  <body>
    <h1>Advanced Scheduler</h1>
    <h2>System Metadata</h2>
    <label>Version <input id="sys-version"/></label><br/>
    <label>Generated At <input id="sys-generated-at" placeholder="2025-06-05T01:45:00Z"/></label><br/>
    <label>Timezone <input id="sys-timezone" value="UTC"/></label><br/>
    <label>Description <input id="sys-description"/></label>

    <h2>Groups</h2>
    <div id="groups"></div>
    <button type="button" id="addGroup">Add Group</button>

    <form method="POST" action="/advanced" style="margin-top:20px;">
      <input type="hidden" name="payload" id="payload" />
      <button type="submit">Send</button>
    </form>

    <pre id="preview">${DEFAULT_JSON}</pre>

    <script>
      const DEFAULT_JSON = ${JSON.stringify(DEFAULT_JSON)};
      const groupsEl = document.getElementById('groups');
      document.getElementById('preview').textContent = DEFAULT_JSON;
      document.getElementById('addGroup').onclick = () => addGroup();

      function addGroup() {
        const g = document.createElement('div');
        g.className = 'group';
        g.innerHTML = \`\n          <hr/>\n          <label>Group ID <input class="group-id"/></label>\n          <label>Group Name <input class="group-name"/></label><br/>\n          <div class="conversations"></div>\n          <button type="button" class="add-conv">Add Conversation</button>\n        \`;
        groupsEl.appendChild(g);
        g.querySelector('.add-conv').onclick = () => addConversation(g);
      }

      function addConversation(groupDiv) {
        const c = document.createElement('div');
        c.className = 'conversation';
        c.innerHTML = \`\n          <h4>Conversation</h4>\n          <label>Conversation ID <input class="conversation-id"/></label><br/>\n          <div class="messages"></div>\n          <button type="button" class="add-msg">Add Message</button>\n        \`;
        groupDiv.querySelector('.conversations').appendChild(c);
        c.querySelector('.add-msg').onclick = () => addMessage(c);
      }

      function addMessage(convDiv) {
        const m = document.createElement('div');
        m.className = 'message';
        m.innerHTML = \`\n          <label>Sender ID <input class="sender-id"/></label>\n          <label>Content <input class="message-content"/></label>\n          <label>Send At <input class="send-at" placeholder="2025-06-05T13:00:00Z"/></label>\n          <label>Reply To <input class="reply-to"/></label><br/>\n        \`;
        convDiv.querySelector('.messages').appendChild(m);
      }

      addGroup();

      document.querySelector('form').onsubmit = () => {
        const payload = {
          system_metadata: {
            version: document.getElementById('sys-version').value,
            generated_at: document.getElementById('sys-generated-at').value,
            timezone: document.getElementById('sys-timezone').value,
            description: document.getElementById('sys-description').value
          },
          groups: []
        };

        document.querySelectorAll('.group').forEach(g => {
          const group = {
            group_id: g.querySelector('.group-id').value,
            group_name: g.querySelector('.group-name').value,
            conversations: []
          };
          g.querySelectorAll('.conversation').forEach(c => {
            const conv = {
              conversation_id: c.querySelector('.conversation-id').value,
              messages: []
            };
            c.querySelectorAll('.message').forEach(m => {
              conv.messages.push({
                sender_id: m.querySelector('.sender-id').value,
                message_content: m.querySelector('.message-content').value,
                send_at: m.querySelector('.send-at').value,
                reply_to: m.querySelector('.reply-to').value
              });
            });
            group.conversations.push(conv);
          });
          payload.groups.push(group);
        });

        const json = JSON.stringify(payload);
        document.getElementById('payload').value = json;
        document.getElementById('preview').textContent = JSON.stringify(payload, null, 2);
      };
    </script>
  </body>
  </html>`

export default function register(app: Hono<{ Bindings: Env }>) {
  app.get('/advanced', c => c.html(HTML))

  app.post('/advanced', async c => {
    const body = await c.req.parseBody()
    const payloadStr = body['payload']?.toString() || ''
    if (!payloadStr) return c.json({ error: 'Missing payload' }, 400)
    let payload: any
    try {
      payload = JSON.parse(payloadStr)
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400)
    }

    if (!Array.isArray(payload.groups)) {
      return c.json({ error: 'Payload missing groups array' }, 400)
    }

    const ids: string[] = []
    for (const group of payload.groups) {
      if (!group.group_id || !Array.isArray(group.conversations)) continue
      for (const conv of group.conversations) {
        const convId = conv.conversation_id || crypto.randomUUID()
        if (!Array.isArray(conv.messages)) continue
        for (const msg of conv.messages) {
          const ts = Date.parse(msg.send_at || msg.timestamp || '')
          if (!msg.sender_id || !msg.message_content || isNaN(ts)) continue
          const task: AdvancedMessageTask = {
            group_id: group.group_id,
            conversation_id: convId,
            message: {
              sender_id: msg.sender_id,
              message_content: msg.message_content,
              reply_to: msg.reply_to,
            },
            send_at: ts,
          }
          const id = crypto.randomUUID()
          await c.env.SCHEDULE_KV.put(`task:${id}`, JSON.stringify(task))
          ids.push(id)
        }
      }
    }

    return c.json({ status: 'scheduled', ids })
  })
}
