# AURIQ IBKR read-only connector

This local service reads an IBKR Live session and writes user-scoped snapshots to
Supabase. It contains no order-placement calls. Credentials for IBKR are entered only
in TWS or IB Gateway; they are never stored here or sent to the browser.

## Prerequisites

1. Install TWS or IB Gateway from Interactive Brokers.
2. Log in with the Live Trading account. The connector never stores IBKR credentials.
3. In TWS open `Global Configuration > API > Settings`:
   - Enable ActiveX and Socket Clients.
   - Keep Read-Only API enabled.
   - Use socket port `7496` for Live TWS.
   - Allow connections from localhost only.
4. For Live IB Gateway use port `4001` instead.

IBKR's Read-Only API setting intentionally prevents API order information. Phase 2
therefore syncs account values and positions only. Order visibility will be designed
separately without enabling automated trading.

## Local setup

```powershell
cd connector
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Fill in `SUPABASE_SECRET_KEY` in `connector/.env`. This file is git-ignored and
must remain on the connector machine. Never place that key in a `VITE_` variable.

Test the socket first:

```powershell
python check_connection.py
```

Start synchronization:

```powershell
python main.py
```
