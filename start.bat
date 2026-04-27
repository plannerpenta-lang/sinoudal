@echo off
echo Starting SINOUDAL servers...
echo.
title Socket.io Server
start "Socket.io Server" cmd /k "cd %~dp0 && node server/index.js"
timeout /t 2 /nobreak > null
title Vite Dev Server
start "Vite Dev Server" cmd /k "cd %~dp0 && npm run dev"
echo.
echo Servers starting...
echo - Socket.io: http://localhost:3001
echo - Vite: http://localhost:5173
echo.
echo Presiona cualquier tecla para salir...
pause > null