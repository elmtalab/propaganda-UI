import { Hono } from 'hono'
import type { Env } from '../types'

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Chat</title>
  <link rel="stylesheet" href="https://unpkg.com/react-chat-elements/dist/main.css" />
  <script src="https://unpkg.com/react@17/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script type="module">
    import { MessageList, Input } from 'https://unpkg.com/react-chat-elements@12.0.18/dist/main.js?module'
    window.ReactChatElements = { MessageList, Input }
  </script>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    .chat-window { border: 1px solid #ccc; height: 400px; overflow-y: scroll; padding: 10px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { MessageList, Input } = window.ReactChatElements;

    function App() {
      const [groupId, setGroupId] = React.useState('');
      const [sender, setSender] = React.useState('user');
      const [text, setText] = React.useState('');
      const [time, setTime] = React.useState('');
      const [messages, setMessages] = React.useState([]);

      const addMessage = () => {
        const ts = time ? new Date(time).toISOString() : new Date().toISOString();
        const m = { sender_id: sender, message_content: text, send_at: ts };
        setMessages(prev => [...prev, m]);
        setText('');
        setTime('');
        fetch('/log', { method: 'POST', body: new URLSearchParams({ group_id: groupId, sender_id: sender, message_content: m.message_content, send_at: ts }) });
      };

      const scheduleAll = () => {
        const payload = { groups: [ { group_id: groupId, conversations: [ { messages } ] } ] };
        fetch('/advanced', { method: 'POST', body: new URLSearchParams({ payload: JSON.stringify(payload) }) })
          .then(r => r.json())
          .then(r => alert('Scheduled ' + (r.ids ? r.ids.length : 0) + ' messages'));
      };

      const dataSource = messages.map(m => ({ position: m.sender_id === 'user' ? 'right' : 'left', type: 'text', text: m.message_content, date: new Date(m.send_at) }));

      return (
        <div>
          <h1>Telegram Chat</h1>
          <div>
            <input placeholder="Group ID" value={groupId} onChange={e => setGroupId(e.target.value)} />
            <input placeholder="Sender" value={sender} onChange={e => setSender(e.target.value)} />
          </div>
          <div className="chat-window">
            <MessageList className="message-list" lockable={true} toBottomHeight={'100%'} dataSource={dataSource} />
          </div>
          <Input placeholder="Message" multiline={true} value={text} onChange={e => setText(e.target.value)} rightButtons={null} />
          <input type="datetime-local" value={time} onChange={e => setTime(e.target.value)} />
          <button onClick={addMessage}>Add</button>
          <button onClick={scheduleAll}>Schedule All</button>
        </div>
      );
    }

    ReactDOM.render(<App />, document.getElementById('root'));
  </script>
</body>
</html>`

export default function register(app: Hono<{ Bindings: Env }>) {
  app.get('/chat', c => c.html(HTML))
}
