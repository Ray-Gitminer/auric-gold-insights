from __future__ import annotations

import logging
import signal
import time
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from ib_async import IB
from supabase import Client, create_client

from config import Settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
log = logging.getLogger("auriq.connector")
running = True


def stop(_signum: int, _frame: Any) -> None:
    global running
    running = False


def number(value: Any) -> float | None:
    if value in (None, "", "-"):
        return None
    try:
        return float(Decimal(str(value)))
    except Exception:
        return None


def account_values(ib: IB, account: str) -> dict[str, float | None]:
    wanted = {
        "NetLiquidation": "net_liquidation",
        "TotalCashValue": "cash_balance",
        "BuyingPower": "buying_power",
        "MaintMarginReq": "margin_used",
        "RealizedPnL": "realized_pnl",
        "UnrealizedPnL": "unrealized_pnl",
    }
    result = {column: None for column in wanted.values()}
    for item in ib.accountValues(account):
        column = wanted.get(item.tag)
        if column and (item.currency in ("", "BASE", "USD")):
            result[column] = number(item.value)
    return result


def ensure_database_records(db: Client, settings: Settings, account: str) -> tuple[str, str]:
    connection = (
        db.table("broker_connections")
        .upsert(
            {
                "user_id": settings.user_id,
                "broker": "IBKR",
                "environment": settings.ibkr_environment,
                "mode": "read_only",
                "status": "online",
                "connector_label": settings.connector_label,
                "last_heartbeat_at": datetime.now(UTC).isoformat(),
                "last_error": None,
            },
            on_conflict="user_id,connector_label",
        )
        .execute()
        .data[0]
    )
    broker_account = (
        db.table("broker_accounts")
        .upsert(
            {
                "user_id": settings.user_id,
                "connection_id": connection["id"],
                "broker_account_id": account,
                "display_name": f"IBKR {settings.ibkr_environment.title()} · {account[-4:]}",
                "base_currency": "USD",
                "account_type": settings.ibkr_environment,
                "is_active": True,
            },
            on_conflict="connection_id,broker_account_id",
        )
        .execute()
        .data[0]
    )
    return connection["id"], broker_account["id"]


def sync_once(ib: IB, db: Client, settings: Settings, account: str) -> None:
    now = datetime.now(UTC).isoformat()
    connection_id, account_id = ensure_database_records(db, settings, account)
    values = account_values(ib, account)
    db.table("portfolio_snapshots").insert(
        {
            "user_id": settings.user_id,
            "account_id": account_id,
            **values,
            "drawdown_pct": None,
            "source_timestamp": now,
        }
    ).execute()

    active_keys: set[str] = set()
    for position in ib.positions(account):
        contract = position.contract
        key = str(contract.conId or f"{contract.secType}:{contract.symbol}")
        active_keys.add(key)
        db.table("ibkr_positions").upsert(
            {
                "user_id": settings.user_id,
                "account_id": account_id,
                "broker_position_key": key,
                "symbol": contract.localSymbol or contract.symbol,
                "asset_class": contract.secType or "UNKNOWN",
                "currency": contract.currency or "USD",
                "quantity": float(position.position),
                "average_cost": number(position.avgCost),
                "source_timestamp": now,
            },
            on_conflict="account_id,broker_position_key",
        ).execute()

    existing = (
        db.table("ibkr_positions")
        .select("id,broker_position_key")
        .eq("account_id", account_id)
        .execute()
        .data
    )
    stale_ids = [row["id"] for row in existing if row["broker_position_key"] not in active_keys]
    if stale_ids:
        db.table("ibkr_positions").delete().in_("id", stale_ids).execute()

    db.table("broker_connections").update(
        {"status": "online", "last_heartbeat_at": now, "last_error": None}
    ).eq("id", connection_id).execute()
    log.info("Synced account %s: %d active positions", account, len(active_keys))


def main() -> None:
    settings = Settings.from_env()
    db = create_client(settings.supabase_url, settings.supabase_secret_key)
    ib = IB()
    try:
        ib.connect(
            settings.ibkr_host,
            settings.ibkr_port,
            clientId=settings.ibkr_client_id,
            timeout=settings.connect_timeout,
            readonly=True,
            account=settings.ibkr_account or "",
        )
        accounts = ib.managedAccounts()
        account = settings.ibkr_account or (accounts[0] if accounts else None)
        if not account:
            raise RuntimeError("IBKR returned no managed account")
        while running:
            sync_once(ib, db, settings, account)
            ib.sleep(settings.sync_interval_seconds)
    finally:
        if ib.isConnected():
            ib.disconnect()


if __name__ == "__main__":
    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)
    main()
