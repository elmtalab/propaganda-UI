#!/usr/bin/env python3
"""Create Cloudflare KV namespaces for the propaganda worker.

The script calls Cloudflare's REST API to create all KV namespaces
referenced in ``wrangler.toml``. Each namespace is prefixed with
``PROP_``.  The generated namespace IDs are then written back to
``wrangler.toml`` so Wrangler can deploy using the correct IDs.

Edit ``CF_ACCOUNT_ID`` and ``CF_API_TOKEN`` below with your Cloudflare
credentials before running the script. The script requires the
``requests`` and ``tomli`` packages which can be installed with:

```
pip install requests tomli tomli-w
```

"""
from __future__ import annotations

import sys
from pathlib import Path

import requests
import tomli
import tomli_w


NAMESPACES = [
    "SCHEDULE_KV",
    "SYSTEM_META_KV",
    "GROUP_KV",
    "GROUP_MEMBERS_KV",
    "CONVERSATION_KV",
    "MESSAGE_KV",
    "AI_USER_KV",
    "AUDIT_LOG_KV",
]

PREFIX = "PROP_"

API_BASE = "https://api.cloudflare.com/client/v4"

# TODO: replace these placeholders with your actual Cloudflare credentials
CF_ACCOUNT_ID = "2c2c7353c68ec11cb139c38961121776"
CF_API_TOKEN = "hy-stGfTgkFFnk7ThNWI_-PuOa262R_GkthqzOke"

WRANGLER_TOML = Path(__file__).resolve().parents[1] / "wrangler.toml"


def create_namespace(account_id: str, token: str, name: str) -> str:

    url = f"{API_BASE}/accounts/{account_id}/storage/kv/namespaces"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    resp = requests.post(url, json={"title": name}, headers=headers)
    if not resp.ok:
        raise RuntimeError(f"Failed to create {name}: {resp.status_code} {resp.text}")
    ns_id = resp.json()["result"]["id"]
    print(f"Created {name}: {ns_id}")
    return ns_id


def main() -> None:
    if "REPLACE_WITH_ACCOUNT_ID" in CF_ACCOUNT_ID or "REPLACE_WITH_API_TOKEN" in CF_API_TOKEN:
        print("Please edit CF_ACCOUNT_ID and CF_API_TOKEN in init_kv.py before running", file=sys.stderr)
        sys.exit(1)

    mapping: dict[str, str] = {}
    for base in NAMESPACES:
        ns_id = create_namespace(CF_ACCOUNT_ID, CF_API_TOKEN, PREFIX + base)
        mapping[base] = ns_id

    if not WRANGLER_TOML.exists():
        print(f"wrangler.toml not found at {WRANGLER_TOML}", file=sys.stderr)
        sys.exit(1)

    cfg = tomli.loads(WRANGLER_TOML.read_text("utf-8"))
    cfg["kv_namespaces"] = [
        {"binding": b, "id": mapping[b]} for b in NAMESPACES
    ]
    WRANGLER_TOML.write_text(tomli_w.dumps(cfg), "utf-8")
    print("\n✅ Updated", WRANGLER_TOML)



if __name__ == "__main__":
    main()
