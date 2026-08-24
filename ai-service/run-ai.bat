@echo off
cd /d "%~dp0"
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    python app.py
) else if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
    python app.py
) else (
    python app.py
)
