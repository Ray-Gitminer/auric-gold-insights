from __future__ import annotations

import os
import sys

from dotenv import load_dotenv
from ib_async import IB

load_dotenv()

host = os.getenv("IBKR_HOST", "127.0.0.1")
port = int(os.getenv("IBKR_PORT", "7496"))
client_id = int(os.getenv("IBKR_CLIENT_ID", "71"))
timeout = float(os.getenv("IBKR_CONNECT_TIMEOUT", "15"))

ib = IB()
try:
    ib.connect(host, port, clientId=client_id, timeout=timeout, readonly=True)
    accounts = ib.managedAccounts()
    if not accounts:
        raise RuntimeError("Connected, but IBKR returned no managed accounts")
    print(f"CONNECTED | host={host} port={port} accounts={','.join(accounts)}")
finally:
    if ib.isConnected():
        ib.disconnect()

sys.exit(0)
