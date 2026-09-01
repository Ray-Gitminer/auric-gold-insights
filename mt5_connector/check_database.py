from __future__ import annotations

from supabase import create_client

from config import Settings

settings = Settings.from_env()
db = create_client(settings.supabase_url, settings.supabase_secret_key)
required_tables = (
    "connector_agents",
    "mt5_accounts",
    "account_snapshots",
    "positions",
    "deals",
    "mt5_candles",
)

missing: list[str] = []
for table in required_tables:
    try:
        db.table(table).select("*", count="exact").limit(0).execute()
        print(f"READY | {table}")
    except Exception:
        missing.append(table)
        print(f"MISSING OR INACCESSIBLE | {table}")

if missing:
    raise SystemExit(
        "Apply supabase/migrations/20260901190000_add_mt5_readonly_portfolio.sql first: "
        + ", ".join(missing)
    )

