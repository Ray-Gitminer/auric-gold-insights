from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


def required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required connector setting: {name}")
    return value


@dataclass(frozen=True)
class Settings:
    ibkr_host: str
    ibkr_port: int
    ibkr_client_id: int
    ibkr_account: str | None
    ibkr_environment: str
    connect_timeout: float
    sync_interval_seconds: float
    supabase_url: str
    supabase_secret_key: str
    user_id: str
    connector_label: str

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            ibkr_host=os.getenv("IBKR_HOST", "127.0.0.1"),
            ibkr_port=int(os.getenv("IBKR_PORT", "7496")),
            ibkr_client_id=int(os.getenv("IBKR_CLIENT_ID", "71")),
            ibkr_account=os.getenv("IBKR_ACCOUNT", "").strip() or None,
            ibkr_environment=os.getenv("IBKR_ENVIRONMENT", "live").strip().lower(),
            connect_timeout=float(os.getenv("IBKR_CONNECT_TIMEOUT", "15")),
            sync_interval_seconds=float(os.getenv("SYNC_INTERVAL_SECONDS", "30")),
            supabase_url=required("SUPABASE_URL"),
            supabase_secret_key=(
                os.getenv("SUPABASE_SECRET_KEY", "").strip()
                or required("SUPABASE_SERVICE_ROLE_KEY")
            ),
            user_id=required("AURIQ_USER_ID"),
            connector_label=os.getenv("CONNECTOR_LABEL", "Local IBKR Live Read-only"),
        )
