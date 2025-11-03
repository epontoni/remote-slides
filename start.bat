@echo off
REM start-simple.bat
REM Ejecuta: 1) npm start (en ventana separada) 2) cloudflared tunnel (en esta ventana)

REM Cambiar al directorio del .bat
cd /d %~dp0

REM 1) Iniciar servidor Node en ventana separada (queda la ventana abierta)
start "Node Server" cmd /k "cd /d %~dp0 && npm start"

REM 2) Iniciar cloudflared en esta ventana para ver su salida
echo.
echo Iniciando cloudflared tunnel --url http://localhost:3000
echo (Verás la salida/errores de cloudflared en esta ventana)
echo.
cloudflared tunnel --url http://localhost:3000

REM Pausa al final si el comando termina (opcional)
pause
