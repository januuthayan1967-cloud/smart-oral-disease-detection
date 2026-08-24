# PowerShell script to start the Python AI Service independently
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

if (Test-Path ".\venv\Scripts\Activate.ps1") {
    Write-Host "Activating Python virtual environment (venv)..." -ForegroundColor Cyan
    & ".\venv\Scripts\Activate.ps1"
    python app.py
} elseif (Test-Path ".\.venv\Scripts\Activate.ps1") {
    Write-Host "Activating Python virtual environment (.venv)..." -ForegroundColor Cyan
    & ".\.venv\Scripts\Activate.ps1"
    python app.py
} else {
    Write-Host "Virtual environment not found, launching with default python..." -ForegroundColor Yellow
    python app.py
}
