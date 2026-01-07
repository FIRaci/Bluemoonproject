@echo off
title BlueMoon - Starting...
color 0A

echo.
echo  ========================================
echo     BLUEMOON APARTMENT MANAGEMENT
echo     Double-click to run!
echo  ========================================
echo.

:: Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "%~dp0run.ps1"

pause
