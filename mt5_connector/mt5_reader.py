from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

import MetaTrader5 as mt5

from config import Settings


TIMEFRAMES = {
    "M1": mt5.TIMEFRAME_M1,
    "M5": mt5.TIMEFRAME_M5,
    "M15": mt5.TIMEFRAME_M15,
    "M30": mt5.TIMEFRAME_M30,
    "H1": mt5.TIMEFRAME_H1,
    "H4": mt5.TIMEFRAME_H4,
    "D1": mt5.TIMEFRAME_D1,
}


def iso_from_epoch(seconds: int | float) -> str:
    return datetime.fromtimestamp(seconds, UTC).isoformat()


class ReadOnlyTerminal:
    """Read-only facade. This module intentionally exposes no order operation."""

    def __init__(self, settings: Settings):
        self.settings = settings

    def connect(self) -> dict[str, Any]:
        kwargs = {"path": str(self.settings.terminal_path)} if self.settings.terminal_path else {}
        if not mt5.initialize(**kwargs):
            raise RuntimeError(f"MT5 initialize failed: {mt5.last_error()}")
        if self.settings.investor_password and not mt5.login(
            self.settings.expected_login,
            password=self.settings.investor_password,
            server=self.settings.expected_server,
        ):
            raise RuntimeError(f"MT5 investor login failed: {mt5.last_error()}")
        terminal = mt5.terminal_info()
        account = mt5.account_info()
        if terminal is None or account is None:
            raise RuntimeError(f"MT5 account unavailable: {mt5.last_error()}")
        if int(account.login) != self.settings.expected_login:
            raise RuntimeError(
                f"Wrong MT5 account: expected ...{str(self.settings.expected_login)[-4:]}, "
                f"received ...{str(account.login)[-4:]}"
            )
        if account.server.casefold() != self.settings.expected_server.casefold():
            raise RuntimeError(
                f"Wrong MT5 server: expected {self.settings.expected_server}, received {account.server}"
            )
        if bool(account.trade_allowed):
            mt5.shutdown()
            raise RuntimeError(
                "Refusing trading-enabled MT5 credential; use an Investor/read-only password only"
            )
        return {**account._asdict(), "terminal_connected": bool(terminal.connected)}

    def close(self) -> None:
        mt5.shutdown()

    def account(self) -> dict[str, Any]:
        value = mt5.account_info()
        if value is None:
            raise RuntimeError(f"MT5 account_info failed: {mt5.last_error()}")
        return value._asdict()

    def positions(self) -> list[dict[str, Any]]:
        values = mt5.positions_get()
        if values is None:
            raise RuntimeError(f"MT5 positions_get failed: {mt5.last_error()}")
        return [item._asdict() for item in values]

    def deals(self) -> list[dict[str, Any]]:
        end = datetime.now(UTC)
        start = end - timedelta(days=self.settings.deal_history_days)
        values = mt5.history_deals_get(start, end)
        if values is None:
            raise RuntimeError(f"MT5 history_deals_get failed: {mt5.last_error()}")
        return [item._asdict() for item in values]

    def candles(self, symbol: str, timeframe: str) -> list[dict[str, Any]]:
        mt5_timeframe = TIMEFRAMES.get(timeframe)
        if mt5_timeframe is None:
            raise RuntimeError(f"Unsupported timeframe: {timeframe}")
        if not mt5.symbol_select(symbol, True):
            raise RuntimeError(f"MT5 cannot select symbol {symbol}: {mt5.last_error()}")
        values = mt5.copy_rates_from_pos(
            symbol, mt5_timeframe, 0, self.settings.bars_per_timeframe
        )
        if values is None:
            raise RuntimeError(
                f"MT5 copy_rates_from_pos failed for {symbol}/{timeframe}: {mt5.last_error()}"
            )
        return [
            {
                "open_time": iso_from_epoch(int(item["time"])),
                "open": float(item["open"]),
                "high": float(item["high"]),
                "low": float(item["low"]),
                "close": float(item["close"]),
                "tick_volume": int(item["tick_volume"]),
                "spread": int(item["spread"]),
            }
            for item in values
        ]
