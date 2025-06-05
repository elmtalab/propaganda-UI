import { Hono } from 'hono'
import type { Env } from '../types'

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Chat Page</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; height: 100vh; display: flex; flex-direction: column; }
    .messages { flex-grow: 1; overflow-y: auto; padding: 10px; }
    .message { display: flex; margin-bottom: 8px; }
    .bubble { padding: 6px 8px; border-radius: 4px; }
    .composer { display: flex; align-items: center; padding: 10px; border-top: 1px solid #ccc; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .avatar-list { position: absolute; bottom: 50px; background: #fff; border: 1px solid #ccc; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
    .avatar-option { display: flex; align-items: center; padding: 5px 10px; cursor: pointer; }
    .avatar-option:hover { background: #f0f0f0; }
    .avatar-option span { margin-left: 6px; }
  </style>
  <script type="module">
    import React from 'https://esm.sh/react@18.2.0'
    import ReactDOM from 'https://esm.sh/react-dom@18.2.0'
    window.React = React
    window.ReactDOM = ReactDOM
  </script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root" style="flex-grow:1"></div>
  <script type="text/babel">
    function App() {
      const avatars = [
        { name: 'Alice', color: '#f44336' },
        { name: 'Bob', color: '#2196F3' },
        { name: 'Carol', color: '#4caf50' }
      ];
      const [showList, setShowList] = React.useState(false);
      const [selected, setSelected] = React.useState(avatars[0]);
      const [text, setText] = React.useState('');
      const [messages, setMessages] = React.useState([]);
      const send = () => {
        if (!text) return;
        setMessages(prev => [...prev, { ...selected, text }]);
        setText('');
      };
      return (
        <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
          <div className="messages">
            {messages.map((m,i) => (
              <div key={i} className="message">
                <div className="avatar" style={{background:m.color, marginRight:8}}>{m.name[0]}</div>
                <div className="bubble" style={{background:m.color + '22'}}>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="composer">
            <div style={{position:'relative', marginRight:8}}>
              <div className="avatar" style={{background:selected.color}} onClick={() => setShowList(!showList)}>{selected.name[0]}</div>
              {showList && (
                <div className="avatar-list">
                  {avatars.map(av => (
                    <div key={av.name} className="avatar-option" onClick={() => {setSelected(av); setShowList(false);}}>
                      <div className="avatar" style={{background:av.color, width:30, height:30}}>{av.name[0]}</div>
                      <span>{av.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input type="text" value={text} onChange={e => setText(e.target.value)} style={{flexGrow:1, padding:'6px'}} placeholder="Type message..." />
            <button onClick={send} style={{marginLeft:8}}>Send</button>
          </div>
        </div>
      );
    }
    ReactDOM.render(<App />, document.getElementById('root'));
  </script>
</body>
</html>`

export default function register(app: Hono<{ Bindings: Env }>) {
  app.get('/chat/page', c => c.html(HTML))
}
