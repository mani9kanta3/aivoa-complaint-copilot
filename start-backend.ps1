$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
docker compose up -d --wait db
if ($LASTEXITCODE -ne 0) {
    throw 'PostgreSQL could not start. Open Docker Desktop and try again.'
}
& '.\.venv\Scripts\python.exe' -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
