@echo off
start "LankaAds Backend" cmd /k "cd /d %~dp0backend && npm run dev"
start "LankaAds Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"