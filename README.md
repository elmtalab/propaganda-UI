# propaganda-UI

This project includes a Cloudflare Worker that schedules messages to be sent to the `propaganda` API at user-specified times.

The repository also provides a simple Material&nbsp;UI React demo in
`frontend/index.html`. Open that file in a browser to walk through a wizard for
entering system metadata, group information and AI user details. The final step
shows the JSON payload that can be posted to a backend of your choice.

## Usage

1. Install dependencies
   ```bash
   npm install
   ```

2. Compile TypeScript
   ```bash
   npx tsc
   ```

3. Initialize KV namespaces. Edit `scripts/init_kv.py` and fill in your
   `CF_ACCOUNT_ID` and `CF_API_TOKEN`. Running the script will create Cloudflare
   KV namespaces prefixed with `PROP_` and update `wrangler.toml` with the
   returned namespace IDs.
   ```bash
   python scripts/init_kv.py

   ```

4. Deploy with Wrangler
   ```bash
   npx wrangler deploy
   ```

The worker exposes a simple HTML form at the root path. Fill in the group ID, sender ID, message content and the ISO timestamp for when the message should be sent. The form submission stores the request in KV. A scheduled event runs every minute to check for pending messages and sends them to `https://propaganda-production.up.railway.app/api/send/`.

For advanced usage, navigate to `/advanced`. This page lets you build a JSON payload using a dynamic form where you can add multiple groups, conversations and messages with individual `send_at` timestamps. Submitting the form stores the messages in KV. The cron job later reads the stored tasks and dispatches them to the API when the scheduled time arrives.

For a guided setup experience, visit `/wizard`. This multi-step form walks through each field and posts the assembled JSON to `/advanced` when finished.

### Telegram-style Scheduler

Navigate to `/chat` for a Telegram-style interface powered by **react-chat-elements**. Enter a group ID and sender name, type your message and optionally pick a time. Messages appear in a scrolling chat window and can be scheduled in bulk with **Schedule All** which posts them to `/advanced`.

You can also open `/chat/<groupId>` to jump straight into a specific group. This page pre-fills the group ID from the URL and lets you send messages in a Telegram-like view. On the deployed Pages site this route is handled by a small function under `frontend/_worker.js` so visiting `/chat/mygroup` works the same as on the Worker preview domain.


Visit `/chatpage` for a multi-group view rendered with **ChatList** from **react-chat-elements**. The page lists a few sample chats similar to Telegram.

