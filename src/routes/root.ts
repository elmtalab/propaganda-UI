import { Hono } from 'hono'
import type { Env } from '../types'

const HTML = `<!DOCTYPE html>
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

export default function register(app: Hono<{ Bindings: Env }>) {
  app.get('/', c => c.html(HTML))
}
