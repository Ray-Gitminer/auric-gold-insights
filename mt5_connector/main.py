from __future__ import annotations

import logging
import signal
import time
from datetime import UTC, datetime
from typing import Any

import MetaTrader5 as mt5
from supabase import Client, create_client

from config import Settings
from mt5_reader import ReadOnlyTerminal, iso_from_epoch

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
log = logging.getLogger("auriq.mt5.readonly")
running = True


def stop(_signum: int, _frame: Any) -> None:
    global running
    running = False


def ensure_records(db: Client, settings: Settings) -> tuple[int, int]:
    now = datetime.now(UTC).isoformat()
    agent = (
        db.table("connector_agents")
        .upsert(
            {
                "user_id": settings.user_id,
                "name": settings.connector_name,
                "machine_label": "Windows MT5",
                "platform": "windows",
                "status": "online",
                "version": "1.0.0-readonly",
                "capabilities": {
                    "read_account": True,
                    "read_positions": True,
                    "read_deals": True,
                    "read_candles": True,
                    "send_orders": False,
                    "modify_orders": False,
                },
                "last_seen_at": now,
                "secret_ref": None,
            },
            on_conflict="user_id,name",
        )
        .execute()
        .data[0]
    )
    account = (
        db.table("mt5_accounts")
        .upsert(
            {
                "user_id": settings.user_id,
                "connector_agent_id": agent["id"],
                "broker": settings.broker,
                "server": settings.expected_server,
                "login": str(settings.expected_login),
                "display_name": settings.display_name,
                "currency": "USD",
                "status": "connected",
                "auto_trade_enabled": False,
                "last_sync_at": now,
            },
            on_conflict="user_id,server,login",
        )
        .execute()
        .data[0]
    )
    return int(agent["id"]), int(account["id"])


def sync_snapshot(db: Client, settings: Settings, account_id: int, info: dict[str, Any], positions: list[dict[str, Any]]) -> None:
    buy = [p for p in positions if p["type"] == mt5.POSITION_TYPE_BUY]
    sell = [p for p in positions if p["type"] == mt5.POSITION_TYPE_SELL]
    balance = float(info["balance"])
    equity = float(info["equity"])
    db.table("account_snapshots").insert(
        {
            "user_id": settings.user_id,
            "account_id": account_id,
            "balance": balance,
            "equity": equity,
            "floating_pnl": float(info["profit"]),
            "drawdown_pct": max(0.0, ((balance - equity) / balance) * 100) if balance else 0.0,
            "margin": float(info["margin"]),
            "free_margin": float(info["margin_free"]),
            "margin_level": float(info["margin_level"]),
            "buy_count": len(buy),
            "buy_lots": sum(float(p["volume"]) for p in buy),
            "buy_pnl": sum(float(p["profit"]) for p in buy),
            "sell_count": len(sell),
            "sell_lots": sum(float(p["volume"]) for p in sell),
            "sell_pnl": sum(float(p["profit"]) for p in sell),
            "captured_at": datetime.now(UTC).isoformat(),
        }
    ).execute()


def sync_positions(db: Client, settings: Settings, account_id: int, rows: list[dict[str, Any]]) -> None:
    tickets: list[int] = []
    for row in rows:
        ticket = int(row["ticket"])
        tickets.append(ticket)
        db.table("positions").upsert(
            {
                "user_id": settings.user_id,
                "account_id": account_id,
                "ticket": ticket,
                "symbol": row["symbol"],
                "side": "BUY" if row["type"] == mt5.POSITION_TYPE_BUY else "SELL",
                "volume": float(row["volume"]),
                "open_price": float(row["price_open"]),
                "current_price": float(row["price_current"]),
                "stop_loss": float(row["sl"]) or None,
                "take_profit": float(row["tp"]) or None,
                "profit": float(row["profit"]),
                "swap": float(row["swap"]),
                "commission": 0.0,
                "magic_number": int(row["magic"]) if row["magic"] else None,
                "opened_at": iso_from_epoch(row["time"]),
                "observed_at": datetime.now(UTC).isoformat(),
            },
            on_conflict="account_id,ticket",
        ).execute()
    stale = db.table("positions").select("id,ticket").eq("account_id", account_id).execute().data
    stale_ids = [item["id"] for item in stale if int(item["ticket"]) not in tickets]
    if stale_ids:
        db.table("positions").delete().in_("id", stale_ids).execute()


def sync_deals(db: Client, settings: Settings, account_id: int, rows: list[dict[str, Any]]) -> None:
    entry_names = {
        mt5.DEAL_ENTRY_IN: "IN",
        mt5.DEAL_ENTRY_OUT: "OUT",
        mt5.DEAL_ENTRY_INOUT: "INOUT",
        mt5.DEAL_ENTRY_OUT_BY: "OUT_BY",
    }
    payload = [
        {
            "user_id": settings.user_id,
            "account_id": account_id,
            "ticket": int(row["ticket"]),
            "position_ticket": int(row["position_id"]) or None,
            "symbol": row["symbol"] or "BALANCE",
            "side": "BUY" if row["type"] == mt5.DEAL_TYPE_BUY else "SELL",
            "entry_type": entry_names.get(row["entry"], "IN"),
            "volume": float(row["volume"]),
            "price": float(row["price"]),
            "profit": float(row["profit"]),
            "commission": float(row["commission"]),
            "swap": float(row["swap"]),
            "magic_number": int(row["magic"]) if row["magic"] else None,
            "executed_at": iso_from_epoch(row["time"]),
        }
        for row in rows
        if row["type"] in (mt5.DEAL_TYPE_BUY, mt5.DEAL_TYPE_SELL)
    ]
    for start in range(0, len(payload), 500):
        db.table("deals").upsert(
            payload[start : start + 500], on_conflict="account_id,ticket"
        ).execute()


def sync_candles(db: Client, settings: Settings, account_id: int, terminal: ReadOnlyTerminal) -> None:
    for symbol in settings.symbols:
        for timeframe in settings.timeframes:
            rows = terminal.candles(symbol, timeframe)
            payload = [
                {**row, "user_id": settings.user_id, "account_id": account_id, "symbol": symbol, "timeframe": timeframe}
                for row in rows
            ]
            if payload:
                db.table("mt5_candles").upsert(
                    payload, on_conflict="account_id,symbol,timeframe,open_time"
                ).execute()


def main() -> None:
    settings = Settings.from_env()
    terminal = ReadOnlyTerminal(settings)
    db = create_client(settings.supabase_url, settings.supabase_secret_key)
    try:
        connected = terminal.connect()
        log.info(
            "Connected read-only | login=...%s server=%s balance=%.2f",
            str(connected["login"])[-4:],
            connected["server"],
            float(connected["balance"]),
        )
        agent_id, account_id = ensure_records(db, settings)
        while running:
            info = terminal.account()
            positions = terminal.positions()
            sync_snapshot(db, settings, account_id, info, positions)
            sync_positions(db, settings, account_id, positions)
            sync_deals(db, settings, account_id, terminal.deals())
            try:
                sync_candles(db, settings, account_id, terminal)
            except Exception as exc:
                log.warning("Candle sync unavailable; portfolio sync continues: %s", exc)
            now = datetime.now(UTC).isoformat()
            db.table("connector_agents").update({"status": "online", "last_seen_at": now}).eq(
                "id", agent_id
            ).execute()
            db.table("mt5_accounts").update({"status": "connected", "last_sync_at": now}).eq(
                "id", account_id
            ).execute()
            log.info("Synced ...%s | positions=%d", str(settings.expected_login)[-4:], len(positions))
            if settings.run_once:
                break
            time.sleep(settings.sync_interval_seconds)
    finally:
        terminal.close()


if __name__ == "__main__":
    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)
    main()
