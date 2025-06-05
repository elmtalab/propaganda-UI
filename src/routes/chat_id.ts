import { Hono } from 'hono'
import type { Env } from '../types'

function page(id: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Chat ${id}</title>
  <link rel="stylesheet" href="https://unpkg.com/react-chat-elements/dist/main.css" />
  <script type="module">
    import React from 'https://esm.sh/react@18.2.0'
    import ReactDOM from 'https://esm.sh/react-dom@18.2.0'
    import { MessageList, Input } from 'https://esm.sh/react-chat-elements@12.0.18'
    window.React = React
    window.ReactDOM = ReactDOM
    window.ReactChatElements = { MessageList, Input }
  </script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    .chat-window { border: 1px solid #ccc; height: 400px; overflow-y: scroll; padding: 10px; }
    .reply-preview { background: #f0f0f0; padding: 4px; margin-top: 4px; font-size: 0.9em; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const GROUP_ID = "${id}"
    const { MessageList, Input } = window.ReactChatElements

    function App() {
      const [sender, setSender] = React.useState('user')
      const [text, setText] = React.useState('')
      const [time, setTime] = React.useState('')
      const [messages, setMessages] = React.useState([])
      const [replyTo, setReplyTo] = React.useState(null)

      const addMessage = () => {
        const ts = time ? new Date(time).toISOString() : new Date().toISOString()
        const m = { sender_id: sender, message_content: text, send_at: ts, reply_to: replyTo }
        setMessages(prev => [...prev, m])
        setText('')
        setTime('')
        setReplyTo(null)
        const params = new URLSearchParams({ group_id: GROUP_ID, sender_id: sender, message_content: m.message_content, send_at: ts })
        if (replyTo !== null) params.append('reply_to', replyTo.toString())
        fetch('/log', { method: 'POST', body: params })
      }

      const scheduleAll = () => {
        const payload = { groups: [ { group_id: GROUP_ID, conversations: [ { messages } ] } ] }
        fetch('/advanced', { method: 'POST', body: new URLSearchParams({ payload: JSON.stringify(payload) }) })
          .then(r => r.json())
          .then(r => alert('Scheduled ' + (r.ids ? r.ids.length : 0) + ' messages'))
      }

      const dataSource = messages.map((m, idx) => {
        const item: any = { position: m.sender_id === 'user' ? 'right' : 'left', type: 'text', text: m.message_content, date: new Date(m.send_at), replyButton: true }
        if (typeof m.reply_to === 'number' && messages[m.reply_to]) {
          item.reply = { title: messages[m.reply_to].sender_id, message: messages[m.reply_to].message_content }
        }
        return item
      })

      return (
        <div>
          <h1>Group {GROUP_ID}</h1>
          <div className="chat-window">
            <MessageList
              className="message-list"
              lockable={true}
              toBottomHeight={'100%'}
              dataSource={dataSource}
              onReplyMessageClick={(_, index) => setReplyTo(index)}
            />
          </div>
          {replyTo !== null && (
            <div className="reply-preview">
              Replying to {messages[replyTo]?.sender_id}: "{messages[replyTo]?.message_content}"
              <button onClick={() => setReplyTo(null)}>Cancel</button>
            </div>
          )}
          <Input placeholder="Message" multiline={true} value={text} onChange={e => setText(e.target.value)} rightButtons={null} />
          <input type="datetime-local" value={time} onChange={e => setTime(e.target.value)} />
          <input placeholder="Sender" value={sender} onChange={e => setSender(e.target.value)} />
          <button onClick={addMessage}>Add</button>
          <button onClick={scheduleAll}>Schedule All</button>
        </div>
      )
    }

    ReactDOM.render(<App />, document.getElementById('root'))
  </script>
</body>
</html>`
}

export default function register(app: Hono<{ Bindings: Env }>) {
  app.get('/chat/:id', c => {
    const id = c.req.param('id')
    return c.html(page(id))
  })
}
