# ============================================================
# BlueMoon - ONE CLICK RUN EVERYTHING
# Usage: .\run.ps1
# ============================================================

param(
    [switch]$Dev,
    [switch]$Docker,
    [switch]$Build,
    [switch]$Help
)

# Colors
$colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  ============================================================" -ForegroundColor $colors.Header
    Write-Host "  |                                                          |" -ForegroundColor $colors.Header
    Write-Host "  |       BLUEMOON APARTMENT MANAGEMENT SYSTEM               |" -ForegroundColor $colors.Header
    Write-Host "  |                                                          |" -ForegroundColor $colors.Header
    Write-Host "  |              One Click - Run Everything                  |" -ForegroundColor $colors.Header
    Write-Host "  |                                                          |" -ForegroundColor $colors.Header
    Write-Host "  ============================================================" -ForegroundColor $colors.Header
    Write-Host ""
}

function Write-Step {
    param($Step, $Message)
    Write-Host "  [$Step] " -ForegroundColor $colors.Info -NoNewline
    Write-Host $Message -ForegroundColor White
}

function Write-OK {
    param($Message)
    Write-Host "  [OK] " -ForegroundColor $colors.Success -NoNewline
    Write-Host $Message -ForegroundColor $colors.Success
}

function Write-Err {
    param($Message)
    Write-Host "  [ERROR] " -ForegroundColor $colors.Error -NoNewline
    Write-Host $Message -ForegroundColor $colors.Error
}

function Write-Warn {
    param($Message)
    Write-Host "  [WARN] " -ForegroundColor $colors.Warning -NoNewline
    Write-Host $Message -ForegroundColor $colors.Warning
}

function Show-Help {
    Write-Banner
    Write-Host "  USAGE:" -ForegroundColor $colors.Info
    Write-Host ""
    Write-Host "    .\run.ps1              " -NoNewline -ForegroundColor White
    Write-Host "# Run development (default)" -ForegroundColor Gray
    Write-Host "    .\run.ps1 -Docker      " -NoNewline -ForegroundColor White
    Write-Host "# Run with Docker containers" -ForegroundColor Gray
    Write-Host "    .\run.ps1 -Build       " -NoNewline -ForegroundColor White
    Write-Host "# Build Electron app (.exe)" -ForegroundColor Gray
    Write-Host "    .\run.ps1 -Help        " -NoNewline -ForegroundColor White
    Write-Host "# Show this help" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  REQUIREMENTS:" -ForegroundColor $colors.Info
    Write-Host "    - Node.js >= 18" -ForegroundColor Gray
    Write-Host "    - Bun (https://bun.sh)" -ForegroundColor Gray
    Write-Host "    - Docker (for PostgreSQL)" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

# Show help if requested
if ($Help) { Show-Help }

Write-Banner

# ============================================================
# STEP 1: Check Requirements
# ============================================================
Write-Step "1/6" "Checking environment..."

$hasErrors = $false

# Check Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-OK "Node.js $nodeVersion"
} else {
    Write-Err "Node.js not installed - https://nodejs.org"
    $hasErrors = $true
}

# Check Bun (try to add to PATH if installed in user directory)
if (Get-Command bun -ErrorAction SilentlyContinue) {
    $bunVersion = bun --version
    Write-OK "Bun v$bunVersion"
} elseif (Test-Path "$env:USERPROFILE\.bun\bin\bun.exe") {
    $env:Path = "$env:USERPROFILE\.bun\bin;" + $env:Path
    $bunVersion = bun --version
    Write-OK "Bun v$bunVersion (added to PATH)"
} else {
    Write-Err "Bun not installed - https://bun.sh"
    $hasErrors = $true
}

# Check PostgreSQL local (port 5432)
$pgConnection = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue
if ($pgConnection.TcpTestSucceeded) {
    Write-OK "PostgreSQL running on port 5432"
} else {
    Write-Err "PostgreSQL not running on port 5432 - Please start PostgreSQL"
    $hasErrors = $true
}

if ($hasErrors) {
    Write-Host ""
    Write-Err "Please install missing tools and try again!"
    exit 1
}

Write-Host ""

# ============================================================
# STEP 2: Setup Paths
# ============================================================
$PROJECT_ROOT = $PSScriptRoot
$BACKEND_DIR = Join-Path $PROJECT_ROOT "backend"
$FRONTEND_DIR = Join-Path $PROJECT_ROOT "frontend"

# ============================================================
# STEP 3: Kill old processes
# ============================================================
Write-Step "2/6" "Cleaning up old processes..."

function Stop-Port {
    param($Port)
    $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($conn) {
        $processIds = $conn | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $processIds) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
        return $true
    }
    return $false
}

$stopped = @()
if (Stop-Port 3000) { $stopped += "3000" }
if (Stop-Port 5433) { $stopped += "5433" }
if (Stop-Port 5555) { $stopped += "5555" }

if ($stopped.Count -gt 0) {
    Write-OK "Stopped processes on ports: $($stopped -join ', ')"
} else {
    Write-OK "No old processes found"
}

Start-Sleep -Seconds 1
Write-Host ""

# ============================================================
# STEP 4: PostgreSQL Check (using local PostgreSQL)
# ============================================================
Write-Step "3/6" "Checking PostgreSQL..."
Write-OK "Using local PostgreSQL on port 5432"

Write-Host ""

# ============================================================
# STEP 5: Install dependencies and Setup Database
# ============================================================
Write-Step "4/6" "Installing dependencies, setting up database..."

Set-Location $BACKEND_DIR

# Install backend deps
if (-not (Test-Path "node_modules")) {
    Write-Host "       -> Installing backend dependencies..." -ForegroundColor Gray
    bun install 2>&1 | Out-Null
}
Write-OK "Backend dependencies OK"

# Generate Prisma client
Write-Host "       -> Generating Prisma client..." -ForegroundColor Gray
bun prisma generate 2>&1 | Out-Null
Write-OK "Prisma client generated"

# Run migrations
Write-Host "       -> Running database migrations..." -ForegroundColor Gray
$env:DATABASE_URL = "postgresql://postgres:admin@localhost:5432/KTPM?schema=public"
bun prisma db push 2>&1 | Out-Null
Write-OK "Database migrations applied"

# Frontend deps
Set-Location $FRONTEND_DIR
if (-not (Test-Path "node_modules")) {
    Write-Host "       -> Installing frontend dependencies..." -ForegroundColor Gray
    npm install 2>&1 | Out-Null
}
Write-OK "Frontend dependencies OK"

Write-Host ""

# ============================================================
# STEP 6: Start Services
# ============================================================
Write-Step "5/6" "Starting services..."

# Start Backend
Set-Location $BACKEND_DIR
Write-Host "       -> Starting Backend API..." -ForegroundColor Gray

$backendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    $env:DATABASE_URL = "postgresql://postgres:admin@localhost:5432/KTPM?schema=public"
    $env:JWT_SECRET = "bluemoon-secret-key-2025-very-secure"
    bun run src/index.ts
} -ArgumentList $BACKEND_DIR

# Wait for backend to start
$retries = 0
$maxRetries = 30
do {
    Start-Sleep -Seconds 1
    $retries++
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000" -TimeoutSec 2 -ErrorAction SilentlyContinue
        $backendReady = $true
    } catch {
        $backendReady = $false
    }
} while (-not $backendReady -and $retries -lt $maxRetries)

if ($backendReady) {
    Write-OK "Backend API running -> http://localhost:3000"
} else {
    Write-Err "Backend failed to start!"
    Receive-Job $backendJob
    exit 1
}

# Start Frontend (Electron)
if ($Build) {
    Write-Host "       -> Building Electron app..." -ForegroundColor Gray
    Set-Location $FRONTEND_DIR
    npm run dist 2>&1 | Out-Null
    Write-OK "Build complete! Check folder: frontend/release"
} else {
    Set-Location $FRONTEND_DIR
    Write-Host "       -> Starting Electron app..." -ForegroundColor Gray
    
    $frontendJob = Start-Job -ScriptBlock {
        param($dir)
        Set-Location $dir
        npm start
    } -ArgumentList $FRONTEND_DIR
    
    Start-Sleep -Seconds 3
    Write-OK "Electron app started"
}

Write-Host ""

# ============================================================
# STEP 7: Done!
# ============================================================
Write-Step "6/6" "Complete!"
Write-Host ""

Write-Host "  +-----------------------------------------------------------+" -ForegroundColor $colors.Success
Write-Host "  |                                                           |" -ForegroundColor $colors.Success
Write-Host "  |   BLUEMOON is running!                                    |" -ForegroundColor $colors.Success
Write-Host "  |                                                           |" -ForegroundColor $colors.Success
Write-Host "  |   Backend API:    http://localhost:3000                   |" -ForegroundColor $colors.Success
Write-Host "  |   Swagger Docs:   http://localhost:3000/swagger           |" -ForegroundColor $colors.Success
Write-Host "  |   Electron App:   Opening...                              |" -ForegroundColor $colors.Success
Write-Host "  |   PostgreSQL:     localhost:5432 (local)                  |" -ForegroundColor $colors.Success
Write-Host "  |                                                           |" -ForegroundColor $colors.Success
Write-Host "  |   Admin Login:    admin / admin123                        |" -ForegroundColor $colors.Success
Write-Host "  |                                                           |" -ForegroundColor $colors.Success
Write-Host "  |   Press Ctrl+C to stop all services                       |" -ForegroundColor $colors.Success
Write-Host "  |                                                           |" -ForegroundColor $colors.Success
Write-Host "  +-----------------------------------------------------------+" -ForegroundColor $colors.Success
Write-Host ""

# Keep script running and show logs
try {
    while ($true) {
        # Check if jobs are still running
        $backendState = (Get-Job -Id $backendJob.Id).State
        
        if ($backendState -eq "Failed") {
            Write-Err "Backend job failed!"
            Receive-Job $backendJob
            break
        }
        
        Start-Sleep -Seconds 5
    }
} finally {
    # Cleanup on exit
    Write-Host ""
    Write-Host "  [STOP] Stopping services..." -ForegroundColor $colors.Warning
    
    Get-Job | Stop-Job -PassThru | Remove-Job -Force
    Stop-Port 3000 | Out-Null
    
    Write-OK "All services stopped"
    Write-Host ""
}
