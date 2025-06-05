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

For advanced usage, navigate to `/advanced` which exposes a large textarea pre-filled with a JSON template. Modify the JSON as needed and submit the form to immediately POST the payload to the same API endpoint.
