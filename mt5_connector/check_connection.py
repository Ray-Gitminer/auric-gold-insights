from __future__ import annotations

from config import Settings
from mt5_reader import ReadOnlyTerminal

settings = Settings.from_env()
terminal = ReadOnlyTerminal(settings)
try:
    account = terminal.connect()
    print(
        "CONNECTED READ-ONLY | "
        f"login=...{str(account['login'])[-4:]} | "
        f"server={account['server']} | "
        f"currency={account['currency']} | "
        f"balance={float(account['balance']):.2f}"
    )
finally:
    terminal.close()

