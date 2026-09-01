# AURIQ MT5 read-only connector

This Windows service reads the MT5 terminal that is already logged in and sends
user-scoped portfolio data to Supabase. It contains no `order_send`, close, modify,
or automated-trading path. The account password stays inside MT5.

## Setup

```powershell
cd mt5_connector
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Fill only `SUPABASE_SECRET_KEY` and `AURIQ_USER_ID` in `.env`. The secret key is
connector-only and must never be copied into a `VITE_` variable, Lovable frontend,
or browser storage. If one MT5 terminal is open, `MT5_TERMINAL_PATH` may remain blank.
Set the exact `terminal64.exe` path when multiple terminals are installed.

Verify the account before syncing:

```powershell
python check_connection.py
```

Verify that the Supabase migration is ready:

```powershell
python check_database.py
```

The check stops if the logged-in account or server differs from the expected values.
Start synchronization only after the check succeeds:

```powershell
python main.py
```
