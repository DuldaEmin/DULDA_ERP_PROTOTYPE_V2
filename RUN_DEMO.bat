@echo off
setlocal

cd /d "%~dp0"
echo Dulda ERP demo baslatici...

where powershell >nul 2>nul
if %errorlevel%==0 (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0RUN_DEMO.ps1"
  if %errorlevel%==0 goto :eof
  echo.
  echo PowerShell ile baslatma basarisiz. Yedek mod deneniyor...
)

where node >nul 2>nul
if not %errorlevel%==0 (
  echo.
  echo Node.js bulunamadi. Lutfen Node.js kurulu oldugunu kontrol et.
  pause
  exit /b 1
)

set PORT=5500
echo.
echo Yedek mod adresi: http://localhost:%PORT%/index.html
start "" "http://localhost:%PORT%/index.html"
node "%~dp0serve.js" %PORT%
call :AskBackupPrompt

echo.
echo Demo kapandi veya hata verdi.
pause
goto :eof

:AskBackupPrompt
set /p backupAns=Backup almak istiyor musun? (E/H): 
if /I "%backupAns%"=="E" goto :RunBackup
if /I "%backupAns%"=="EVET" goto :RunBackup
echo Backup atlandi.
goto :eof

:RunBackup
if not exist "%~dp0AUTO_BACKUP_GITHUB.ps1" (
  echo Backup script bulunamadi.
  goto :eof
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0AUTO_BACKUP_GITHUB.ps1"
goto :eof
