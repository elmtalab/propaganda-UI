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
interface AdvancedMessageTask {
  group_id: string
  conversation_id?: string
  message: {
    sender_id: string
    message_content: string
    reply_to?: string
  }
  send_at: number
}


// Endpoint that ultimately receives the scheduled messages
const API_URL = 'https://propaganda-production.up.railway.app/api/send/'

// Create a minimal Hono application to handle HTTP routes
const app = new Hono<{ Bindings: Env }>()

// Template JSON shown in the advanced form for convenience
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
      "created_at": "2024-12-02T12:00:00Z",
      "created_by": 987654321,
      "group_description": "News about altcoins.",
      "members": [],
      "conversations": [
        {
          "conversation_id": "conv2",
          "messages": [
            {
              "sender_id": "765432109",
              "message_content": "Daily altcoin update",
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

const WIZARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Setup Wizard</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
  <script src="https://unpkg.com/react@17/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@mui/material@5/umd/material-ui.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>body { margin: 0; padding: 20px; font-family: Roboto, sans-serif; }</style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { Stepper, Step, StepLabel, Button, TextField, Container, Box, CssBaseline } = MaterialUI;
    const useMediaQuery = MaterialUI.useMediaQuery;

    function App() {
      const steps = ['System Metadata', 'Group Info', 'Conversation', 'Message', 'AI User', 'Audit Log', 'Summary'];
      const [activeStep, setActiveStep] = React.useState(0);
      const [data, setData] = React.useState({
        system_metadata: { version: '', generated_at: '', timezone: '', description: '' },
        group: { group_id: '', group_name: '', privacy_level: '', created_at: '', created_by: '', group_description: '' },
        conversation: { conversation_id: '', start_time: '', initiated_by: '', topic: '' },
        message: { message_id: '', sender_id: '', message_content: '', timestamp: '' },
        ai_user: { user_id: '', user_name: '', role: '', status: '', max_messages_per_hour: '' },
        audit_log: { event_id: '', event_type: '', actor_id: '', target_id: '', timestamp: '' }
      });
      const isMobile = useMediaQuery('(max-width:600px)');

      const handleChange = (path) => (e) => {
        const keys = path.split('.');
        setData(prev => {
          const updated = { ...prev };
          let obj = updated;
          for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
          obj[keys[keys.length - 1]] = e.target.value;
          return updated;
        });
      };

      const handleNext = () => setActiveStep(s => s + 1);
      const handleBack = () => setActiveStep(s => s - 1);

      const renderSystem = () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
          <TextField fullWidth label="Version" value={data.system_metadata.version} onChange={handleChange('system_metadata.version')} />
          <TextField fullWidth label="Generated At" placeholder="2025-06-05T01:45:00Z" value={data.system_metadata.generated_at} onChange={handleChange('system_metadata.generated_at')} />
          <TextField fullWidth label="Timezone" value={data.system_metadata.timezone} onChange={handleChange('system_metadata.timezone')} />
          <TextField fullWidth label="Description" value={data.system_metadata.description} onChange={handleChange('system_metadata.description')} />
        </Box>
      );

      const renderGroup = () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
          <TextField fullWidth label="Group ID" value={data.group.group_id} onChange={handleChange('group.group_id')} />
          <TextField fullWidth label="Group Name" value={data.group.group_name} onChange={handleChange('group.group_name')} />
          <TextField fullWidth label="Privacy Level" value={data.group.privacy_level} onChange={handleChange('group.privacy_level')} />
          <TextField fullWidth label="Created At" placeholder="2024-12-01T18:09:55Z" value={data.group.created_at} onChange={handleChange('group.created_at')} />
          <TextField fullWidth label="Created By" value={data.group.created_by} onChange={handleChange('group.created_by')} />
          <TextField fullWidth label="Group Description" value={data.group.group_description} onChange={handleChange('group.group_description')} />
        </Box>
      );

      const renderConversation = () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
          <TextField fullWidth label="Conversation ID" value={data.conversation.conversation_id} onChange={handleChange('conversation.conversation_id')} />
          <TextField fullWidth label="Start Time" placeholder="2025-06-04T22:17:12Z" value={data.conversation.start_time} onChange={handleChange('conversation.start_time')} />
          <TextField fullWidth label="Initiated By" value={data.conversation.initiated_by} onChange={handleChange('conversation.initiated_by')} />
          <TextField fullWidth label="Topic" value={data.conversation.topic} onChange={handleChange('conversation.topic')} />
        </Box>
      );

      const renderMessage = () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
          <TextField fullWidth label="Message ID" value={data.message.message_id} onChange={handleChange('message.message_id')} />
          <TextField fullWidth label="Sender ID" value={data.message.sender_id} onChange={handleChange('message.sender_id')} />
          <TextField fullWidth label="Content" value={data.message.message_content} onChange={handleChange('message.message_content')} />
          <TextField fullWidth label="Timestamp" placeholder="2025-06-04T22:20:00Z" value={data.message.timestamp} onChange={handleChange('message.timestamp')} />
        </Box>
      );

      const renderAIUser = () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
          <TextField fullWidth label="User ID" value={data.ai_user.user_id} onChange={handleChange('ai_user.user_id')} />
          <TextField fullWidth label="User Name" value={data.ai_user.user_name} onChange={handleChange('ai_user.user_name')} />
          <TextField fullWidth label="Role" value={data.ai_user.role} onChange={handleChange('ai_user.role')} />
          <TextField fullWidth label="Status" value={data.ai_user.status} onChange={handleChange('ai_user.status')} />
          <TextField fullWidth label="Max Msgs/Hour" value={data.ai_user.max_messages_per_hour} onChange={handleChange('ai_user.max_messages_per_hour')} />
        </Box>
      );

      const renderAudit = () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
          <TextField fullWidth label="Event ID" value={data.audit_log.event_id} onChange={handleChange('audit_log.event_id')} />
          <TextField fullWidth label="Event Type" value={data.audit_log.event_type} onChange={handleChange('audit_log.event_type')} />
          <TextField fullWidth label="Actor ID" value={data.audit_log.actor_id} onChange={handleChange('audit_log.actor_id')} />
          <TextField fullWidth label="Target ID" value={data.audit_log.target_id} onChange={handleChange('audit_log.target_id')} />
          <TextField fullWidth label="Timestamp" placeholder="2025-06-04T22:16:54Z" value={data.audit_log.timestamp} onChange={handleChange('audit_log.timestamp')} />
        </Box>
      );

      const renderSummary = () => (
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: 16 }}>
{JSON.stringify(data, null, 2)}
        </pre>
      );

      const renderStepContent = (step) => {
        switch (step) {
          case 0: return renderSystem();
          case 1: return renderGroup();
          case 2: return renderConversation();
          case 3: return renderMessage();
          case 4: return renderAIUser();
          case 5: return renderAudit();
          default: return renderSummary();
        }
      };

      const submit = async () => {
        const resp = await fetch('/advanced', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ payload: JSON.stringify(data) })
        });
        const result = await resp.json();
        alert('Server response: ' + JSON.stringify(result));
      };

      return (
        <Container maxWidth="sm">
          <CssBaseline />
          <Stepper activeStep={activeStep} orientation={isMobile ? 'vertical' : 'horizontal'} sx={{ mt: 2 }}>
           {steps.map((label, idx) => (
              <Step key={label} sx={{ display: idx === activeStep ? 'flex' : 'none' }}>

                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {renderStepContent(activeStep)}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 4 }}>
            {activeStep > 0 && <Button onClick={handleBack}>Back</Button>}
            {activeStep < steps.length - 1 && <Button variant="contained" onClick={handleNext}>Next</Button>}
            {activeStep === steps.length - 1 && <Button variant="contained" onClick={submit}>Send</Button>}
          </Box>
        </Container>
      );
    }

    ReactDOM.render(<App />, document.getElementById('root'));
  </script>
</body>
</html>`

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

// Multi-step wizard that posts JSON to /advanced
app.get('/wizard', c => {
  return c.html(WIZARD_HTML)
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

// Display a textarea that lets a user craft the full JSON payload
app.get('/advanced', c => {
  const html = `<!DOCTYPE html>
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
        g.innerHTML = \`
          <hr/>
          <label>Group ID <input class="group-id"/></label>
          <label>Group Name <input class="group-name"/></label><br/>
          <div class="conversations"></div>
          <button type="button" class="add-conv">Add Conversation</button>
        \`;
        groupsEl.appendChild(g);
        g.querySelector('.add-conv').onclick = () => addConversation(g);
      }

      function addConversation(groupDiv) {
        const c = document.createElement('div');
        c.className = 'conversation';
        c.innerHTML = \`
          <h4>Conversation</h4>
          <label>Conversation ID <input class="conversation-id"/></label><br/>
          <div class="messages"></div>
          <button type="button" class="add-msg">Add Message</button>
        \`;
        groupDiv.querySelector('.conversations').appendChild(c);
        c.querySelector('.add-msg').onclick = () => addMessage(c);
      }

      function addMessage(convDiv) {
        const m = document.createElement('div');
        m.className = 'message';
        m.innerHTML = \`
          <label>Sender ID <input class="sender-id"/></label>
          <label>Content <input class="message-content"/></label>
          <label>Send At <input class="send-at" placeholder="2025-06-05T13:00:00Z"/></label>
          <label>Reply To <input class="reply-to"/></label><br/>
        \`;
        convDiv.querySelector('.messages').appendChild(m);
      }

      // Start with one group for convenience
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
  return c.html(html)
})

// Accept the JSON entered on the advanced form and store each message as a task
app.post('/advanced', async c => {
  const body = await c.req.parseBody()
  const payloadStr = body["payload"]?.toString() || ''
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
            reply_to: msg.reply_to
          },
          send_at: ts
        }
        const id = crypto.randomUUID()
        await c.env.SCHEDULE_KV.put(`task:${id}`, JSON.stringify(task))
        ids.push(id)
      }
    }
  }

  return c.json({ status: 'scheduled', ids })
})

// Export the app to let Wrangler handle requests
export default app

// Cron handler executed once a minute as configured in wrangler.toml
export const scheduled = async (event: ScheduledController, env: Env, ctx: ExecutionContext) => {
  const now = Date.now()
  // Look for all pending tasks

  const list = await env.SCHEDULE_KV.list({ prefix: 'task:' })
  for (const key of list.keys) {
    const data = await env.SCHEDULE_KV.get(key.name, { type: 'json' }) as any
    if (!data) continue

    const send = async (groups: any) => {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups })
      })
      await env.SCHEDULE_KV.delete(key.name)
    }

    if ('groups' in data) {
      const task = data as SchedulePayload
      if (task.send_at <= now) {
        await send(task.groups)
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
        ])
      }
    }
  }
}
