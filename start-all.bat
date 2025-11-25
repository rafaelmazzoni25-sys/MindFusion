@echo off
echo ========================================
echo Mind-Task Fusion - Inicializacao Completa
echo ========================================
echo.
echo Este script vai abrir DOIS terminais:
echo   1. Backend PHP (porta 8000)
echo   2. Frontend React (porta 5173)
echo.
echo Pressione qualquer tecla para continuar...
pause >nul

echo.
echo [1/2] Iniciando Backend...
start "Backend PHP - Mind-Task Fusion" cmd /k "cd backend\api && echo Backend iniciado em http://localhost:8000 && php -S localhost:8000"

echo [2/2] Iniciando Frontend...
timeout /t 2 >nul
start "Frontend React - Mind-Task Fusion" cmd /k "echo Frontend iniciado em http://localhost:5173 && npm run dev"

echo.
echo ========================================
echo Ambos os servidores estao iniciando!
echo ========================================
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Abra seu navegador em: http://localhost:5173
echo.
echo Para parar os servidores, feche as janelas abertas
echo ========================================
