from __future__ import annotations

import json
import logging
import signal
import time
import urllib.error
import urllib.request
from typing import Any

from config import Settings
from mt5_reader import ReadOnlyTerminal

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
log = logging.getLogger("auriq.mt5.readonly")
running = True


def stop(_signum: int, _frame: Any) -> None:
    global running
    running = False


def sync_candles(settings: Settings, terminal: ReadOnlyTerminal, bar_count: int | None = None) -> int:
    sent = 0
    for symbol in settings.symbols:
        for timeframe in settings.timeframes:
            rows = terminal.candles(symbol, timeframe, bar_count)
            if not rows:
                continue
            payload = {
                "userId": settings.user_id,
                "connectorName": settings.connector_name,
                "account": {
                    "login": str(settings.expected_login),
                    "server": settings.expected_server,
                    "broker": settings.broker,
                    "displayName": settings.display_name,
                },
                "candles": [
                    {
                        "symbol": symbol,
                        "timeframe": timeframe,
                        "openTime": row["open_time"],
                        "open": row["open"],
                        "high": row["high"],
                        "low": row["low"],
                        "close": row["close"],
                        "tickVolume": row["tick_volume"],
                        "spread": row["spread"],
                    }
                    for row in rows
                ],
            }
            request = urllib.request.Request(
                settings.api_url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "X-AURIQ-Connector-Secret": settings.connector_secret,
                },
                method="POST",
            )
            try:
                with urllib.request.urlopen(request, timeout=30) as response:
                    if response.status != 200:
                        raise RuntimeError(f"AURIQ API returned HTTP {response.status}")
            except urllib.error.HTTPError as exc:
                raise RuntimeError(f"AURIQ API rejected candles with HTTP {exc.code}") from exc
            sent += len(rows)
    return sent


def connect_with_retry(settings: Settings) -> ReadOnlyTerminal:
    delay = 5.0
    while running:
        terminal = ReadOnlyTerminal(settings)
        try:
            connected = terminal.connect()
            log.info(
                "Connected read-only | login=...%s server=%s",
                str(connected["login"])[-4:],
                connected["server"],
            )
            return terminal
        except Exception as exc:  # MT5 closed, logged out, network down
            log.warning("MT5 not ready (%s) - retrying in %.0fs", exc, delay)
            try:
                terminal.close()
            except Exception:
                pass
            time.sleep(delay)
            delay = min(delay * 2, 60.0)
    raise SystemExit(0)


def main() -> None:
    settings = Settings.from_env()
    terminal = connect_with_retry(settings)
    # Full history on first sync and after any failure, so gaps are backfilled.
    need_backfill = True
    failures = 0
    try:
        while running:
            try:
                sent = sync_candles(settings, terminal, None if need_backfill else 3)
                log.info("Synced ...%s | candles=%d", str(settings.expected_login)[-4:], sent)
                need_backfill = False
                failures = 0
                if settings.run_once:
                    break
                time.sleep(settings.sync_interval_seconds)
            except Exception as exc:
                failures += 1
                need_backfill = True
                wait = min(5.0 * failures, 60.0)
                log.warning("Sync failed (%s) - retry %d in %.0fs", exc, failures, wait)
                time.sleep(wait)
                if failures % 3 == 0:
                    log.info("Reconnecting to MT5 terminal")
                    try:
                        terminal.close()
                    except Exception:
                        pass
                    terminal = connect_with_retry(settings)
    finally:
        terminal.close()


if __name__ == "__main__":
    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)
    main()
