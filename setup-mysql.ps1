# MySQL Setup Script - Run as Administrator
Write-Host "Setting up MySQL..." -ForegroundColor Green

$mysqlBin = "C:\Program Files\MySQL\MySQL Server 8.4\bin"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script requires administrator privileges!" -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as administrator', then run this script again." -ForegroundColor Yellow
    pause
    exit 1
}

Set-Location $mysqlBin

# Initialize MySQL data directory
Write-Host "Initializing MySQL data directory..." -ForegroundColor Cyan
& .\mysqld.exe --initialize-insecure --console

# Install MySQL service
Write-Host "Installing MySQL service..." -ForegroundColor Cyan
& .\mysqld.exe --install MySQL

# Start MySQL service
Write-Host "Starting MySQL service..." -ForegroundColor Cyan
Start-Service MySQL
Start-Sleep -Seconds 5

# Set root password
Write-Host "Setting root password to 1234..." -ForegroundColor Cyan
& .\mysql.exe -u root --skip-password -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '1234'; FLUSH PRIVILEGES;"

# Create database and tables
Write-Host "Creating student_portal database..." -ForegroundColor Cyan
Get-Content "$projectRoot\database\mysql\schema.sql" | & .\mysql.exe -u root -p1234

Write-Host "`nMySQL setup complete!" -ForegroundColor Green
Write-Host "You can now run: npm run init-db" -ForegroundColor Yellow
Set-Location $projectRoot
pause
