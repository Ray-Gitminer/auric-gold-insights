# AURIQ MT5 read-only connector

This Windows service reads XAUUSD candles from an MT5 terminal that is already
logged in and sends only candle data to AURIQ. It contains no `order_send`, close,
modify, portfolio, position, or automated-trading path. The account password stays
inside MT5.

## Setup

```powershell
cd mt5_connector
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Create one strong random shared secret and save the same value in Lovable as
`MT5_CONNECTOR_SHARED_SECRET` and in the local `.env`. Add the signed-in AURIQ user
ID as `AURIQ_USER_ID`. Neither value belongs in a `VITE_` variable or browser storage.
If one MT5 terminal is open, `MT5_TERMINAL_PATH` may remain blank.
Set the exact `terminal64.exe` path when multiple terminals are installed.

Verify the account before syncing:

```powershell
python check_connection.py
```

The check stops if the logged-in account or server differs from the expected values.
Start synchronization only after the check succeeds:

```powershell
python main.py
```

The Dashboard changes the chart badge to `MT5 LIVE · READ-ONLY` only while fresh
candles are arriving. It returns to the sample chart automatically after 20 seconds
without a successful sync.

## Keep XAUUSD data flowing 24/7

- Start with `run_agent.bat` instead of `python main.py`; it restarts the agent if it ever exits.
- The agent retries automatically when MT5 is closed, logged out, or the network drops, and re-sends full history after any failure so no candles are missing.
- Auto-start on boot: press Win+R, type `shell:startup`, and put a shortcut to `run_agent.bat` there.
- Windows power settings: set Sleep to "Never" (or use a Windows VPS), and keep MT5 logged in with AutoTrading not required.
- In the app, the chart shows `MT5 LIVE` while candles arrive; if the agent stops it keeps the last real candles with an "Agent paused · last HH:MM" label instead of switching back to sample data.
