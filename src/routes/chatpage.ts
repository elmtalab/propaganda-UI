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
    import { ChatList } from 'https://esm.sh/react-chat-elements@12.0.18'
    window.React = React
    window.ReactDOM = ReactDOM
    window.ReactChatElements = { ChatList }
  </script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }

  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { ChatList } = window.ReactChatElements;

    function App() {
      const chats = [
        {
          avatar: 'https://avatars.githubusercontent.com/u/80540635?v=4',
          alt: 'kursat_avatar',
          title: 'Kursat',
          subtitle: "Why don't we go to the No Way Home movie this weekend ?",
          date: new Date(),
          unread: 3,
        }
      ];

      return <ChatList className="chat-list" dataSource={chats} />;

    }

    ReactDOM.render(<App />, document.getElementById('root'));
  </script>
</body>
</html>`

export default function register(app: Hono<{ Bindings: Env }>) {
  app.get('/chatpage', c => c.html(HTML))
}
