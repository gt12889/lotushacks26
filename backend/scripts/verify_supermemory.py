"""Verify Supermemory: set SUPERMEMORY_API_KEY in repo-root .env, then run from repo:

    python backend/scripts/verify_supermemory.py

Indexing is async; this script waits briefly then uses ``search.memories`` (hybrid),
which matches how the MediScrape API recalls context.
"""
import os
import sys
import time
from pathlib import Path

_backend = Path(__file__).resolve().parent.parent
_root = _backend.parent
sys.path.insert(0, str(_backend))

from dotenv import load_dotenv

load_dotenv(_root / ".env")

from supermemory import Supermemory


def main() -> None:
    if not os.environ.get("SUPERMEMORY_API_KEY", "").strip():
        print("Missing SUPERMEMORY_API_KEY. Copy .env.example to .env and set your key.")
        sys.exit(1)

    client = Supermemory()
    tag = "verify-script-user"

    client.add(
        content="User prefers dark mode for the pharmacy dashboard",
        container_tags=[tag],
    )

    print("Add queued; waiting for indexing…")
    time.sleep(6)

    results = client.search.memories(
        q="dark mode",
        container_tag=tag,
        limit=5,
        search_mode="hybrid",
        rewrite_query=True,
        rerank=True,
    )
    print("Supermemory verification OK")
    print(results)


if __name__ == "__main__":
    main()
