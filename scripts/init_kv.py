#!/usr/bin/env python3
"""Create Cloudflare KV namespaces for the propaganda worker.

The script uses Cloudflare's REST API to create the KV namespaces
referenced in `wrangler.toml`. Every namespace is prefixed with
`PROP_` as requested.

Usage:
  python scripts/init_kv.py --account-id <ACCOUNT_ID> --api-token <API_TOKEN>

Alternatively set the `CF_ACCOUNT_ID` and `CF_API_TOKEN` environment
variables so the CLI flags can be omitted.
"""
import argparse
import os
import sys
import requests

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


def create_namespace(account_id: str, token: str, name: str) -> None:
    url = f"{API_BASE}/accounts/{account_id}/storage/kv/namespaces"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    resp = requests.post(url, json={"title": name}, headers=headers)
    if resp.ok:
        ns_id = resp.json()["result"]["id"]
        print(f"Created {name}: {ns_id}")
    else:
        print(f"Failed to create {name}: {resp.status_code} {resp.text}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Initialize Cloudflare KV namespaces")
    parser.add_argument("--account-id", default=os.getenv("CF_ACCOUNT_ID"))
    parser.add_argument("--api-token", default=os.getenv("CF_API_TOKEN"))
    args = parser.parse_args()

    if not args.account_id or not args.api_token:
        print("Cloudflare account ID and API token are required", file=sys.stderr)
        sys.exit(1)

    for base in NAMESPACES:
        create_namespace(args.account_id, args.api_token, PREFIX + base)


if __name__ == "__main__":
    main()
