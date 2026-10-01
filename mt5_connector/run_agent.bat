@echo off
REM AURIQ MT5 read-only agent - restarts automatically if it ever exits.
cd /d "%~dp0"
:loop
python main.py
echo Agent stopped - restarting in 10 seconds...
timeout /t 10 /nobreak >nul
goto loop
