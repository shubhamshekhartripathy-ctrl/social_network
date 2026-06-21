# Start Web Application

Write-Host "==================================================" -ForegroundColor Magenta
Write-Host "   🚀 STARTING WEB APPLICATION" -ForegroundColor Magenta
Write-Host "==================================================" -ForegroundColor Magenta



# Start Backend Job
Write-Host "[1/2] Starting Node.js API Wrapper on port 3000..." -ForegroundColor Cyan
Start-Job -Name "BackendAPI" -ScriptBlock {
    Set-Location -Path "$using:PWD\backend"
    node server.js
} | Out-Null

# Start Frontend Job
Write-Host "[2/2] Starting Vite Web Frontend..." -ForegroundColor Cyan
Start-Job -Name "ViteFrontend" -ScriptBlock {
    Set-Location -Path "$using:PWD\frontend"
    npm run dev
} | Out-Null

Write-Host "==================================================" -ForegroundColor Green
Write-Host "   SUCCESS: Web Application is running!" -ForegroundColor Green
Write-Host "   - Open your browser to: http://localhost:5173" -ForegroundColor Yellow
Write-Host "   - To stop servers later, close the PowerShell window or run: Remove-Job -State Running -Force" -ForegroundColor Gray
Write-Host "==================================================" -ForegroundColor Green

# Optional: keep script running so jobs don't die if run directly from file explorer
while ($true) { Start-Sleep -Seconds 3600 }
