from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

CONNECTOR_DIR = Path(__file__).resolve().parent
load_dotenv(CONNECTOR_DIR / ".env")
# Reuse the existing local connector's Supabase credentials when present. This
# avoids copying a server secret into another file and never exposes it to the UI.
load_dotenv(CONNECTOR_DIR.parent / "connector" / ".env", override=False)


def required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required connector setting: {name}")
    return value


@dataclass(frozen=True)
class Settings:
    terminal_path: Path | None
    expected_login: int
    expected_server: str
    investor_password: str | None
    display_name: str
    broker: str
    account_type: str
    symbols: tuple[str, ...]
    timeframes: tuple[str, ...]
    bars_per_timeframe: int
    deal_history_days: int
    sync_interval_seconds: float
    supabase_url: str
    supabase_secret_key: str
    user_id: str
    connector_name: str
    run_once: bool

    @classmethod
    def from_env(cls) -> "Settings":
        raw_path = os.getenv("MT5_TERMINAL_PATH", "").strip()
        return cls(
            terminal_path=Path(raw_path) if raw_path else None,
            expected_login=int(required("MT5_EXPECTED_LOGIN")),
            expected_server=required("MT5_EXPECTED_SERVER"),
            investor_password=os.getenv("MT5_INVESTOR_PASSWORD", "").strip() or None,
            display_name=os.getenv("MT5_DISPLAY_NAME", "MT5 account").strip(),
            broker=os.getenv("MT5_BROKER", "Unknown broker").strip(),
            account_type=os.getenv("MT5_ACCOUNT_TYPE", "unknown").strip(),
            symbols=tuple(x.strip() for x in required("MT5_SYMBOLS").split(",") if x.strip()),
            timeframes=tuple(
                x.strip().upper() for x in required("MT5_TIMEFRAMES").split(",") if x.strip()
            ),
            bars_per_timeframe=max(50, min(int(os.getenv("MT5_BARS_PER_TIMEFRAME", "500")), 5000)),
            deal_history_days=max(1, min(int(os.getenv("MT5_DEAL_HISTORY_DAYS", "120")), 730)),
            sync_interval_seconds=max(2.0, float(os.getenv("SYNC_INTERVAL_SECONDS", "5"))),
            supabase_url=required("SUPABASE_URL"),
            supabase_secret_key=required("SUPABASE_SECRET_KEY"),
            user_id=required("AURIQ_USER_ID"),
            connector_name=os.getenv("CONNECTOR_NAME", "AURIQ MT5 Read-only").strip(),
            run_once=os.getenv("RUN_ONCE", "false").strip().lower() in ("1", "true", "yes"),
        )
