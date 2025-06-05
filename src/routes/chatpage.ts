import { Hono } from 'hono'
import type { Env } from '../types'

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Chat Page</title>
  <link rel="stylesheet" href="https://unpkg.com/react-chat-elements/dist/main.css" />
  <script type="module">
    import React from 'https://esm.sh/react@18.2.0'
    import ReactDOM from 'https://esm.sh/react-dom@18.2.0'
    import { ChatList, MessageList, Input } from 'https://esm.sh/react-chat-elements@12.0.18'
    window.React = React
    window.ReactDOM = ReactDOM
    window.ReactChatElements = { ChatList, MessageList, Input }
  </script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; }
    .container { display: flex; max-width: 800px; height: 500px; margin: 20px auto; border: 1px solid #ccc; }
    .sidebar { width: 250px; border-right: 1px solid #ccc; overflow-y: auto; }
    .chat { flex: 1; display: flex; flex-direction: column; }
    .chat-body { flex: 1; overflow-y: auto; padding: 10px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { ChatList, MessageList, Input } = window.ReactChatElements;

    function App() {
      const [groups, setGroups] = React.useState([]);
      const [active, setActive] = React.useState(null);
      const [groupName, setGroupName] = React.useState('');
      const [text, setText] = React.useState('');

      const addGroup = () => {
        if (!groupName) return;
        const g = { id: Date.now().toString(), name: groupName, messages: [] };
        setGroups(prev => [...prev, g]);
        setActive(g);
        setGroupName('');
      };

      const addMessage = () => {
        if (!active || !text) return;
        const msg = { position: 'right', type: 'text', text, date: new Date() };
        setGroups(prev => prev.map(g => g.id === active.id ? { ...g, messages: [...g.messages, msg] } : g));
        setText('');
      };

      const chatItems = groups.map(g => ({
        id: g.id,
        title: g.name,
        subtitle: g.messages[g.messages.length - 1]?.text || '',
        date: g.messages[g.messages.length - 1]?.date
      }));

      const activeMessages = active ? active.messages : [];

      return (
        <div className="container">
          <div className="sidebar">
            <div style={{ padding: 10 }}>
              <input placeholder="New group" value={groupName} onChange={e => setGroupName(e.target.value)} />
              <button onClick={addGroup}>Add</button>
            </div>
            <ChatList className="chat-list" dataSource={chatItems} onClick={item => setActive(groups.find(g => g.id === item.id))} />
          </div>
          <div className="chat">
            <div className="chat-body">
              <MessageList className="message-list" lockable={true} toBottomHeight={'100%'} dataSource={activeMessages} />
            </div>
            <Input
              placeholder="Message"
              multiline={true}
              value={text}
              onChange={e => setText(e.target.value)}
              rightButtons={<button onClick={addMessage}>Send</button>}
            />
          </div>
        </div>
      );
    }

    ReactDOM.render(<App />, document.getElementById('root'));
  </script>
</body>
</html>`

export default function register(app: Hono<{ Bindings: Env }>) {
  app.get('/chatpage', c => c.html(HTML))
}
